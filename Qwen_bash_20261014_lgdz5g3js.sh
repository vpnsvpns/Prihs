#!/bin/sh

# === НАСТРОЙКИ ===
# Список пакетов, связанных с туннелированием/прокси/VPN
# Добавьте сюда свои пакеты, если они отличаются
PACKAGES=(
    "v2ray-core"
    "xray-core"
    "shadowsocks-libev"
    "shadowsocksr-libev"
    "simple-obfs"
    "trojan-plus"
    "hysteria"
    "naiveproxy"
    "wireguard-tools"
    "kmod-wireguard"
    "openvpn-openssl"
    "openvpn-mbedtls"
    "luci-app-v2ray"
    "luci-app-xray"
    "luci-app-openvpn"
    "luci-app-wireguard"
    "chinadns-ng"
    "dns2socks"
    "ipt2socks"
    "redsocks2"
    "pdnsd-alt"
    "microsocks"
)

LOG_FILE="/tmp/cleanup_log.txt"
echo "=== Начало очистки $(date) ===" > "$LOG_FILE"

# Функция проверки, запущен ли процесс, связанный с пакетом
is_process_running() {
    local pkg_name="$1"
    # Пытаемся найти исполняемые файлы, связанные с пакетом
    # Это эвристика: мы ищем процессы по именам бинарников
    local binaries=""
    
    case "$pkg_name" in
        v2ray-core|luci-app-v2ray) binaries="v2ray" ;;
        xray-core|luci-app-xray) binaries="xray" ;;
        shadowsocks-libev) binaries="ss-local ss-redir ss-server ss-tunnel" ;;
        shadowsocksr-libev) binaries="ssr-local ssr-redir ssr-server" ;;
        trojan-plus) binaries="trojan" ;;
        hysteria) binaries="hysteria" ;;
        naiveproxy) binaries="naiveproxy" ;;
        wireguard-tools|kmod-wireguard) binaries="wg wg-quick" ;;
        openvpn-openssl|openvpn-mbedtls|luci-app-openvpn) binaries="openvpn" ;;
        chinadns-ng) binaries="chinadns-ng" ;;
        dns2socks) binaries="dns2socks" ;;
        ipt2socks) binaries="ipt2socks" ;;
        redsocks2) binaries="redsocks2" ;;
        microsocks) binaries="microsocks" ;;
        *) binaries="$pkg_name" ;; # Попытка угадать по имени пакета
    esac

    for bin in $binaries; do
        if pgrep -x "$bin" > /dev/null 2>&1; then
            return 0 # Процесс найден
        fi
    done
    
    # Дополнительная проверка: если есть init-скрипт и он enabled/running
    if [ -f "/etc/init.d/$pkg_name" ] || [ -f "/etc/init.d/${pkg_name#luci-app-}" ]; then
        local init_name="${pkg_name#luci-app-}"
        if /etc/init.d/$init_name enabled 2>/dev/null && /etc/init.d/$init_name running 2>/dev/null; then
            return 0
        fi
    fi

    return 1 # Процесс не найден
}

# Основной цикл
for pkg in "${PACKAGES[@]}"; do
    # Проверяем, установлен ли пакет
    if opkg list-installed | grep -q "^$pkg "; then
        echo "Пакет $pkg установлен."
        
        if is_process_running "$pkg"; then
            echo "[ПРОПУЩЕНО] $pkg используется прямо сейчас (процесс активен)." | tee -a "$LOG_FILE"
        else
            echo "[УДАЛЕНИЕ] $pkg не используется. Удаляем..." | tee -a "$LOG_FILE"
            # Удаляем пакет и конфиги (--force-depends может потребоваться, но опасно)
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

# Очистка кеша opkg
echo "Очистка кеша opkg..."
opkg clean

echo "=== Завершение очистки ===" >> "$LOG_FILE"
echo "Готово. Лог сохранен в $LOG_FILE"
echo "Рекомендуется перезагрузить роутер: reboot"