#!/bin/sh

LOG_FILE="/tmp/cleanup_log.txt"
echo "=== Начало очистки $(date) ===" > "$LOG_FILE"

# Список пакетов — через пробел, без массивов
PACKAGES="v2ray-core xray-core shadowsocks-libev shadowsocksr-libev simple-obfs trojan-plus hysteria naiveproxy wireguard-tools kmod-wireguard openvpn-openssl openvpn-mbedtls luci-app-v2ray luci-app-xray luci-app-openvpn luci-app-wireguard chinadns-ng dns2socks ipt2socks redsocks2 pdnsd-alt microsocks"

# Функция: получить бинарники по имени пакета
get_binaries() {
    case "$1" in
        v2ray-core|luci-app-v2ray) echo "v2ray" ;;
        xray-core|luci-app-xray) echo "xray" ;;
        shadowsocks-libev) echo "ss-local ss-redir ss-server ss-tunnel" ;;
        shadowsocksr-libev) echo "ssr-local ssr-redir ssr-server" ;;
        trojan-plus) echo "trojan" ;;
        hysteria) echo "hysteria" ;;
        naiveproxy) echo "naiveproxy" ;;
        wireguard-tools|kmod-wireguard) echo "wg wg-quick" ;;
        openvpn-openssl|openvpn-mbedtls|luci-app-openvpn) echo "openvpn" ;;
        chinadns-ng) echo "chinadns-ng" ;;
        dns2socks) echo "dns2socks" ;;
        ipt2socks) echo "ipt2socks" ;;
        redsocks2) echo "redsocks2" ;;
        microsocks) echo "microsocks" ;;
        *) echo "$1" ;;
    esac
}

# Функция: проверка, запущен ли процесс
is_process_running() {
    pkg_name="$1"
    binaries=$(get_binaries "$pkg_name")

    for bin in $binaries; do
        if pgrep -x "$bin" > /dev/null 2>&1; then
            return 0
        fi
    done

    # Проверка через init-скрипт
    init_name="${pkg_name#luci-app-}"
    if [ -f "/etc/init.d/$init_name" ]; then
        if /etc/init.d/"$init_name" enabled 2>/dev/null && /etc/init.d/"$init_name" running 2>/dev/null; then
            return 0
        fi
    fi

    return 1
}

# Основной цикл
for pkg in $PACKAGES; do
    if opkg list-installed | grep -q "^$pkg "; then
        echo "Пакет $pkg установлен."

        if is_process_running "$pkg"; then
            echo "[ПРОПУЩЕНО] $pkg используется прямо сейчас." | tee -a "$LOG_FILE"
        else
            echo "[УДАЛЕНИЕ] $pkg не используется. Удаляем..." | tee -a "$LOG_FILE"
            opkg remove "$pkg" --autoremove 2>>"$LOG_FILE"
            if [ $? -eq 0 ]; then
                echo "Успешно удален: $pkg" | tee -a "$LOG_FILE"
            else
                echo "Ошибка при удалении: $pkg" | tee -a "$LOG_FILE"
            fi
        fi
    else
        echo "Пакет $pkg не установлен. Пропускаем."
    fi
done

echo "Очистка кеша opkg..."
opkg clean

echo "=== Завершение очистки ===" >> "$LOG_FILE"
echo "Готово. Лог: $LOG_FILE"
echo "Рекомендуется: reboot"
