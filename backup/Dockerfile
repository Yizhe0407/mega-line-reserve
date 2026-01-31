FROM debian:bookworm-slim

# 安裝 MySQL 客戶端和必要工具
RUN apt-get update && apt-get install -y \
    default-mysql-client \
    cron \
    curl \
    unzip \
    ca-certificates \
    gzip \
    && rm -rf /var/lib/apt/lists/*

# 安裝 rclone
RUN curl https://rclone.org/install.sh | bash

# 建立備份目錄
RUN mkdir -p /backup /scripts

# 複製備份腳本
COPY backup.sh /scripts/backup.sh
RUN chmod +x /scripts/backup.sh

# 設定 cron job（每天凌晨 2:00 執行）
RUN echo "0 2 * * * /scripts/backup.sh >> /var/log/backup.log 2>&1" > /etc/cron.d/backup-cron
RUN chmod 0644 /etc/cron.d/backup-cron
RUN crontab /etc/cron.d/backup-cron

# 建立 log 檔案
RUN touch /var/log/backup.log

# 啟動腳本
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
