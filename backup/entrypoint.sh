#!/usr/bin/env bash
set -Eeuo pipefail

umask 077

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

is_true() {
  case "${1,,}" in
    true|1|yes|on) return 0 ;;
    *) return 1 ;;
  esac
}

prepare_rclone_config() {
  local config_file=${RCLONE_CONFIG:-/config/rclone/rclone.conf}
  local config_dir
  local current_uid
  local directory_uid
  local config_uid

  config_dir=$(dirname "${config_file}")
  current_uid=$(id -u)

  mkdir -p "${config_dir}" \
    || { log "錯誤: 無法建立 rclone 設定目錄 ${config_dir}" >&2; exit 1; }

  [[ -d "${config_dir}" && ! -L "${config_dir}" ]] \
    || { log "錯誤: ${config_dir} 必須是一般目錄且不可為符號連結" >&2; exit 1; }

  directory_uid=$(stat -c '%u' "${config_dir}")
  if [[ "${directory_uid}" != "${current_uid}" ]]; then
    log "錯誤: ${config_dir} 必須由容器 UID ${current_uid} 擁有，目前為 UID ${directory_uid}" >&2
    log "請依 backup/README.md 修正 rclone_config volume 權限" >&2
    exit 1
  fi

  chmod 0700 "${config_dir}" \
    || { log "錯誤: 無法將 ${config_dir} 權限設為 0700" >&2; exit 1; }

  if [[ -e "${config_file}" ]]; then
    [[ -f "${config_file}" && ! -L "${config_file}" ]] \
      || { log "錯誤: ${config_file} 必須是一般檔案且不可為符號連結" >&2; exit 1; }

    config_uid=$(stat -c '%u' "${config_file}")
    if [[ "${config_uid}" != "${current_uid}" ]]; then
      log "錯誤: ${config_file} 必須由容器 UID ${current_uid} 擁有，目前為 UID ${config_uid}" >&2
      exit 1
    fi

    chmod 0600 "${config_file}" \
      || { log "錯誤: 無法將 ${config_file} 權限設為 0600" >&2; exit 1; }
  fi
}

# rclone-config 維護服務沿用相同非 root 映像，並以 umask 077 建立敏感設定。
if [[ "${1:-}" == "rclone" ]]; then
  shift
  prepare_rclone_config

  RCLONE_STATUS=0
  rclone "$@" || RCLONE_STATUS=$?

  # OAuth token 更新後再次收斂檔案權限；保留原始 rclone exit code。
  prepare_rclone_config
  exit "${RCLONE_STATUS}"
fi

BACKUP_SCHEDULE_TIME=${BACKUP_SCHEDULE_TIME:-02:00}
RUN_ON_STARTUP=${RUN_ON_STARTUP:-false}
SLEEP_PID=''

if [[ ! "${BACKUP_SCHEDULE_TIME}" =~ ^([01][0-9]|2[0-3]):[0-5][0-9]$ ]]; then
  log "錯誤: BACKUP_SCHEDULE_TIME 必須使用 24 小時制 HH:MM 格式" >&2
  exit 1
fi

# 啟用遠端上傳時先 fail closed，避免排程看似正常但實際上傳未加密。
/scripts/backup.sh --check-upload-config

stop_scheduler() {
  log "收到停止訊號，正在結束備份排程"
  if [[ -n "${SLEEP_PID}" ]]; then
    kill "${SLEEP_PID}" 2>/dev/null || true
  fi
  exit 0
}
trap stop_scheduler SIGINT SIGTERM

run_backup() {
  if ! /scripts/backup.sh; then
    log "錯誤: 本次備份失敗，將保留排程並於下一次重試" >&2
    return 1
  fi
}

seconds_until_next_run() {
  local now_epoch
  local target_epoch

  now_epoch=$(date +%s)
  target_epoch=$(date -d "today ${BACKUP_SCHEDULE_TIME}" +%s)

  if (( target_epoch <= now_epoch )); then
    target_epoch=$(date -d "tomorrow ${BACKUP_SCHEDULE_TIME}" +%s)
  fi

  printf '%s\n' "$((target_epoch - now_epoch))"
}

log "MySQL 備份服務已啟動"
log "每日備份時間: ${BACKUP_SCHEDULE_TIME}（${TZ:-UTC}）"
log "本地保留天數: ${BACKUP_RETENTION_DAYS:-7}"
log "rclone crypt 上傳: ${ENABLE_RCLONE_UPLOAD:-false}"

if is_true "${RUN_ON_STARTUP}"; then
  log "執行啟動備份"
  run_backup || exit 1
fi

while true; do
  SLEEP_SECONDS=$(seconds_until_next_run)
  NEXT_RUN=$(date -d "+${SLEEP_SECONDS} seconds" '+%Y-%m-%d %H:%M:%S %Z')
  log "下一次備份時間: ${NEXT_RUN}"

  sleep "${SLEEP_SECONDS}" &
  SLEEP_PID=$!
  wait "${SLEEP_PID}"
  SLEEP_PID=''

  run_backup || true
done
