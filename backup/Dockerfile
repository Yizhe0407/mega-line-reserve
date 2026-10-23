# syntax=docker/dockerfile:1.7

ARG DEBIAN_IMAGE=debian:12.12-slim@sha256:d5d3f9c23164ea16f31852f95bd5959aad1c5e854332fe00f7b3a20fcc9f635c

FROM ${DEBIAN_IMAGE} AS rclone-downloader

ARG TARGETARCH
ARG RCLONE_RELEASE=1.74.4

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl unzip \
    && rm -rf /var/lib/apt/lists/* \
    && case "${TARGETARCH}" in \
        amd64) RCLONE_SHA256="fe435e0c36228e7c2f116a8701f01127bb1f694005fc11d1f27186c8bca4115d" ;; \
        arm64) RCLONE_SHA256="97685285c9ad6a0cf17d5844115d2a67245af6444db672187074bd9c358de419" ;; \
        *) echo "不支援的 CPU 架構: ${TARGETARCH}" >&2; exit 1 ;; \
      esac \
    && RCLONE_ARCHIVE="rclone-v${RCLONE_RELEASE}-linux-${TARGETARCH}.zip" \
    && curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
        "https://downloads.rclone.org/v${RCLONE_RELEASE}/${RCLONE_ARCHIVE}" \
        --output "/tmp/${RCLONE_ARCHIVE}" \
    && echo "${RCLONE_SHA256}  /tmp/${RCLONE_ARCHIVE}" | sha256sum --check --strict \
    && unzip -q "/tmp/${RCLONE_ARCHIVE}" -d /tmp/rclone \
    && install -m 0755 \
        "/tmp/rclone/rclone-v${RCLONE_RELEASE}-linux-${TARGETARCH}/rclone" \
        /usr/local/bin/rclone \
    && rclone version

FROM ${DEBIAN_IMAGE} AS runner

ARG BACKUP_UID=10001
ARG BACKUP_GID=10001

# Debian 已保留 backup:34；另建專用帳號，避免改動基礎映像的系統帳號。
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        ca-certificates \
        default-mysql-client \
        gzip \
        tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid "${BACKUP_GID}" backupsvc \
    && useradd --system --uid "${BACKUP_UID}" --gid backupsvc \
        --home-dir /home/backup --create-home --shell /usr/sbin/nologin backupsvc \
    && install -d -o backupsvc -g backupsvc -m 0700 /backup /config/rclone /scripts

COPY --from=rclone-downloader /usr/local/bin/rclone /usr/local/bin/rclone
COPY --chown=backupsvc:backupsvc backup.sh /scripts/backup.sh
COPY --chown=backupsvc:backupsvc entrypoint.sh /entrypoint.sh

RUN chmod 0755 /scripts/backup.sh /entrypoint.sh

ENV HOME=/home/backup
ENV RCLONE_CONFIG=/config/rclone/rclone.conf
ENV XDG_CACHE_HOME=/tmp/.cache

USER backupsvc

STOPSIGNAL SIGTERM
ENTRYPOINT ["/entrypoint.sh"]
