#!/usr/bin/env bash
set -Eeuo pipefail

# 備份檔、暫存檔與 rclone 設定一律只允許擁有者讀寫。
umask 077

log() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"
}

fail() {
  log "錯誤: $*" >&2
  exit 1
}

is_true() {
  case "${1,,}" in
    true|1|yes|on) return 0 ;;
    *) return 1 ;;
  esac
}

validate_non_negative_integer() {
  local name=$1
  local value=$2

  [[ "${value}" =~ ^[0-9]+$ ]] || fail "${name} 必須是非負整數"
}

validate_rclone_config_permissions() {
  local config_file=${RCLONE_CONFIG:-/config/rclone/rclone.conf}
  local config_dir
  local current_uid
  local directory_uid
  local directory_mode_text
  local config_uid
  local config_mode_text

  config_dir=$(dirname "${config_file}")
  current_uid=$(id -u)

  [[ -d "${config_dir}" && ! -L "${config_dir}" ]] \
    || fail "rclone 設定目錄必須是一般目錄且不可為符號連結: ${config_dir}"
  [[ -f "${config_file}" && ! -L "${config_file}" ]] \
    || fail "rclone 設定檔必須是一般檔案且不可為符號連結: ${config_file}"
  [[ -r "${config_file}" && -w "${config_file}" ]] \
    || fail "rclone 設定檔必須可由非 root 備份使用者讀寫，以支援 OAuth token 更新"

  directory_uid=$(stat -c '%u' "${config_dir}")
  directory_mode_text=$(stat -c '%a' "${config_dir}")
  config_uid=$(stat -c '%u' "${config_file}")
  config_mode_text=$(stat -c '%a' "${config_file}")

  [[ "${directory_uid}" == "${current_uid}" ]] \
    || fail "rclone 設定目錄必須由容器 UID ${current_uid} 擁有，目前為 UID ${directory_uid}"
  [[ "${config_uid}" == "${current_uid}" ]] \
    || fail "rclone 設定檔必須由容器 UID ${current_uid} 擁有，目前為 UID ${config_uid}"

  (( (8#${directory_mode_text} & 0077) == 0 )) \
    || fail "rclone 設定目錄不可授予 group/other 權限，目前為 ${directory_mode_text}，應為 700"
  (( (8#${directory_mode_text} & 0700) == 0700 )) \
    || fail "rclone 設定目錄 owner 必須可讀寫與進入，目前為 ${directory_mode_text}，應為 700"
  (( (8#${config_mode_text} & 0077) == 0 )) \
    || fail "rclone 設定檔不可授予 group/other 權限，目前為 ${config_mode_text}，應為 600"
  (( (8#${config_mode_text} & 0600) == 0600 )) \
    || fail "rclone 設定檔 owner 必須可讀寫，目前為 ${config_mode_text}，應為 600"
}

validate_crypt_remote() {
  local remote_path=${RCLONE_CRYPT_REMOTE:-}
  local remote_name
  local remote_type

  is_true "${ENABLE_RCLONE_UPLOAD:-false}" || return 0

  [[ -n "${remote_path}" ]] || fail "啟用上傳時必須設定 RCLONE_CRYPT_REMOTE"
  [[ "${remote_path}" == *:* ]] || fail "RCLONE_CRYPT_REMOTE 必須包含 rclone remote 名稱與冒號"
  validate_rclone_config_permissions

  remote_name=${remote_path%%:*}
  remote_type=$(
    rclone config show "${remote_name}" 2>/dev/null \
      | awk -F= '/^[[:space:]]*type[[:space:]]*=/{gsub(/[[:space:]]/, "", $2); print tolower($2); exit}'
  )

  [[ "${remote_type}" == "crypt" ]] \
    || fail "RCLONE_CRYPT_REMOTE 必須指向 type=crypt 的 remote，不允許直接上傳未加密備份"
}

validate_crypt_remote

if [[ "${1:-}" == "--check-upload-config" ]]; then
  exit 0
fi

MYSQL_HOST=${MYSQL_HOST:-mysql}
MYSQL_PORT=${MYSQL_PORT:-3306}
MYSQL_USER=${MYSQL_USER:-}
MYSQL_DATABASE=${MYSQL_DATABASE:-}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-}
MYSQL_PASSWORD_FILE=${MYSQL_PASSWORD_FILE:-}
BACKUP_DIR=${BACKUP_DIR:-/backup}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

[[ -n "${MYSQL_USER}" ]] || fail "MYSQL_USER 未設定"
[[ "${MYSQL_USER,,}" != "root" ]] || fail "備份禁止使用 MySQL root，請建立專用最低權限帳號"
[[ -n "${MYSQL_DATABASE}" ]] || fail "MYSQL_DATABASE 未設定"
validate_non_negative_integer "MYSQL_PORT" "${MYSQL_PORT}"
validate_non_negative_integer "BACKUP_RETENTION_DAYS" "${BACKUP_RETENTION_DAYS}"

if [[ -n "${MYSQL_PASSWORD_FILE}" ]]; then
  [[ -r "${MYSQL_PASSWORD_FILE}" ]] || fail "MYSQL_PASSWORD_FILE 無法讀取"
  MYSQL_PASSWORD=$(<"${MYSQL_PASSWORD_FILE}")
fi

[[ -n "${MYSQL_PASSWORD}" ]] || fail "未透過 MYSQL_PASSWORD_FILE 或 MYSQL_PASSWORD 提供備份帳號密碼"

mkdir -p "${BACKUP_DIR}"

SAFE_DATABASE_NAME=$(printf '%s' "${MYSQL_DATABASE}" | tr -c 'A-Za-z0-9_.-' '_')
TIMESTAMP=$(date +'%Y%m%d_%H%M%S')
BACKUP_FILE="${BACKUP_DIR}/mysql_backup_${SAFE_DATABASE_NAME}_${TIMESTAMP}.sql.gz"
TEMP_BACKUP_FILE=$(mktemp "${BACKUP_DIR}/.mysql_backup_${SAFE_DATABASE_NAME}_${TIMESTAMP}.XXXXXX.sql.gz")

cleanup() {
  rm -f "${TEMP_BACKUP_FILE}"
}
trap cleanup EXIT

log "開始備份資料庫: ${MYSQL_DATABASE}"

# 使用 MYSQL_PWD 避免密碼出現在 mysqldump 的程序參數中；容器仍應以 Docker secret 注入密碼。
MYSQL_PWD="${MYSQL_PASSWORD}" mysqldump \
  --host="${MYSQL_HOST}" \
  --port="${MYSQL_PORT}" \
  --user="${MYSQL_USER}" \
  --single-transaction \
  --quick \
  --skip-lock-tables \
  --no-tablespaces \
  --triggers \
  "${MYSQL_DATABASE}" \
  | gzip > "${TEMP_BACKUP_FILE}"

if ! gzip -t "${TEMP_BACKUP_FILE}" || [[ ! -s "${TEMP_BACKUP_FILE}" ]]; then
  fail "備份檔驗證失敗"
fi

chmod 0600 "${TEMP_BACKUP_FILE}"
mv "${TEMP_BACKUP_FILE}" "${BACKUP_FILE}"
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
log "本地備份成功: ${BACKUP_FILE}（大小: ${BACKUP_SIZE}）"

UPLOAD_FAILED=false
if is_true "${ENABLE_RCLONE_UPLOAD:-false}"; then
  DESTINATION="${RCLONE_CRYPT_REMOTE%/}/$(basename "${BACKUP_FILE}")"
  log "開始上傳至已加密的 rclone remote"

  if rclone copyto "${BACKUP_FILE}" "${DESTINATION}" \
      --checkers 4 \
      --transfers 2 \
      --log-level INFO; then
    log "加密遠端上傳成功"
  else
    log "錯誤: 加密遠端上傳失敗" >&2
    UPLOAD_FAILED=true
  fi
fi

log "清理 ${BACKUP_RETENTION_DAYS} 天前的本地舊備份"
find "${BACKUP_DIR}" \
  -name 'mysql_backup_*.sql.gz' \
  -type f \
  -mtime "+${BACKUP_RETENTION_DAYS}" \
  -delete

if is_true "${UPLOAD_FAILED}"; then
  exit 1
fi

log "備份流程完成"
