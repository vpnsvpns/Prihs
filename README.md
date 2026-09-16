# ⚡️ Prihs — Энциклопедия по обходу блокировок бесплатно в России ([Telegram канал проекта](https://t.me/PrihsVPN) @PrihsVPN)
## Зеркало Prihs на [GitLab](https://gitlab.com/prihs/Prihs)
## Благодарности: Akres (Akres.fun), Igareck

## 💰 Поддержать проект

Если проект помогает вам оставаться на связи, вы можете поддержать разработчиков:

* **Донат создателю Prihs:** [DonationAlerts](https://www.donationalerts.com/r/prihvpn)
* **Донат Лёше (Второй создатель):** [DonationAlerts](https://www.donationalerts.com/r/leshabalenci)

---

## 📖 Что у нас есть?

* **⚡️ VPN Подписки:** Актуальные сабки для прокси-клиентов (Karing, Throne и др.).
* **✈️ Прокси для Telegram:** Быстрые и стабильные MTProto прокси.
* **🌍 IPTV:** Телевизионные каналы на русском языке, которые официально ушли из России
* **🎯 DNS Для обхода блокировок:** Специальные DNS сервера для обхода блокировок нейросетей (Gemini, ChatGPT и другие), сервисы xbox  и игр Supercell (Brawl Stars, Clash of Clans) без включения VPN.

---

## ⚙️ Выбор VPN-клиента и его настройка

На Хабре вышел разбор критической уязвимости мобильных клиентов на базе xray/sing-box (автор `@runetfreedom`), связанной с утечкой IP-адресов через localhost-порты. Вот актуальный статус приложений, которые исправили эту проблему:

**Рекомендуем использовать именно Karing. На Android лучше Exclave**

* **Clash Mi** ✅ - Лучший Clash клиент на iPhone, максимальная гибкость и автовыбор сервера. От создателей Karing. ПОДХОДИТ ТОЛЬКО ДЛЯ CLASH ПОДПИСОК
* **Karing** ✅ — **Решено!** Добавлена ручная авторизация для mixed-инbound подключений, лучший клиент. Максимальная гибкость на всех платформах и стабильная работа при большом кол-во конфигов
* **Shadowrocket** ✅ — **Решено!** ЕСЛИ БРАТЬ ТО ТОЛЬКО НА iPhone! Отличный клиент, хорошая работа xhttp конфигов
* **V2BOX** ✅ — **Решено!** Гибкий, хороший интерфейс и оптимизации под xhttp конфиги. Лагает при большом кол-во конфигов
* **Exclave** ✅ — **Решено!** Пользователь/пароль локального прокси" в настройках**. Похож на Karing. Рекомендованный для андройд

Включать фрагментацию в любом клиенте советую только при белых списках

---

## 🛠 DNS в клиентах и настройка

Если у вас пинг успешный, но трафик со временем перестает проходить.

То это все можно решить через настройки Remote DNS (Удаленный DNS) в клиенте.

Приведу примеры:

<details>
<summary><strong><code> Karing </code></strong> ⬅ Нажмите, чтобы открыть </summary>

㋡

```diff
   Путь: "Настройки" ⚙️ → "DNS" → "Сервер" → Нажать на "Трафик прокси" → Снять все галочки кроме:

   https://doh.pub/dns-query
   https://dns.alidns.com/dns-query
   https://cloudflare-dns.com/dns-query
   https://dns.google/dns-query

   Либо, как вариант, попробовать один, например: https://dns.google/dns-query.

   Остальные пункты в меню "DNS" → "Сервер" трогать не нужно.
```

</details>

<details>
<summary><strong><code> v2rayN </code></strong> ⬅ Нажмите, чтобы открыть </summary>

㋡

```diff
Путь: "Settings" -> "DNS Settings" -> "Basic DNS Settings"

Замените содержимое "Remote DNS" (Удаленный DNS) на строку:

https://dns.google/dns-query,https://dns.quad9.net/dns-query,https://dns.adguard-dns.com/dns-query,https://freedns.controld.com/p0,https://dns.mullvad.net/dns-query,https://cloudflare-dns.com/dns-query,https://doh.opendns.com/dns-query
```

</details>

<details>
<summary><strong><code> Exclave </code></strong> ⬅ Нажмите, чтобы открыть </summary>

㋡

```diff
В разделе "☰" → "Настройки" найдите строку/пункт с названием "Удаленный DNS".
Вместо дефолтного значения поставьте: https://dns.google/dns-query
```

</details>

**Во время режима Белых Списков (Беспилотной опасности) никакие иностранные DNS-провайдеры не работают (ни Google, ни Cloudflare, ни Quad9, ни Alibaba, ни OpenDNS, никакой). В этом случае используйте либо автоматический DNS от вашего провайдера, либо DNS/DNS-over-HTTPS от Яндекса. В противном случае VPN-конфигурации для БС просто не заработают.**
**DoH - это не панацея и не волшебное лекарство от всех проблем, но очень важная деталь при настройке сети и ваших клиентов.**

### `Настройка` 

*За предоставленнный подробные мануалы лагодарности пользователю @Igareck. (GOAT)*

<details>
<summary><strong><code> Гайд по обходу блокировок для Karing </code></strong> ⬅ Нажмите, чтобы открыть </summary>

---

1. Перейдите в **Настройки** (иконка слева сверху).
2. Найдите пункт **Mixed**.
3. В поле **UserName** впишите любой ник.
4. В поле **Password** задайте сложный пароль (например: `fG7!kL92#xPq`).
5. Перезапустите подключение.
> **📌 Важное примечание:** Если после настройки при подключении к Wi-Fi всплывает окно с текстом *«Введите данные от прокси 127.0.0.1»* — просто введите ваш созданный **UserName** и **Password** из настроек Karing.

От пользователя @999ivan33:

**Конфигурация для стабильной работы на мобильном интернете и Wi-Fi**

**1. Импорт конфигов и управление профилями**

· Подписка: Добавить через «Добавить ссылку на конфигурацию» → вставить raw-URL подписки (рекомендуется BLACK_VLESS_RUS_mobile.txt для телефона или BLACK_VLESS_RUS.txt для ПК). Автообновление включить.

· Отдельные ключи: Импорт из буфера обмена. Каждый ключ или подписка создают отдельный профиль. Несколько ключей можно добавить в один профиль через мультивыбор при импорте.

· Выбор сервера: На главном экране нажать на название сервера → «Тест задержки». Использовать «Автовыбор» для автоматического переключения на самый быстрый.

**2. Правила маршрутизации (Split-Tunneling)**

Правила обрабатываются сверху вниз до первого совпадения. Final — ловушка для непопавшего трафика.

· Общий подход: Создаём отдельные группы для разных типов трафика. В каждой группе активируем встроенные Rule Set (build-in), при необходимости дополняем domain_suffix и Идентификатор пакета приложения (только Android).

· Российские сервисы (Госуслуги, банки, маркетплейсы):

  · Логическая операция: OR.
  
  · Rule Set(build-in): geosite:ru (основной) + geoip:ru (если не ломает звонки).
  
  · Действие: «Напрямую» (Direct).
  
  · Обоснование: Весь трафик из зоны .ru/.su/.рф и российских IP идёт в обход VPN для максимальной скорости и отсутствия санкционных блокировок по IP.
  
· Мессенджеры (Telegram/AyuGram, WhatsApp):

  · Проблема: Блокировки атакуют протоколы звонков. GeoIP маршрутизация делает трафик уязвимым к DPI.
  
  · Решение: Создать отдельные правила на каждое приложение.
  
  · Для AyuGram:
  
    · Rule Set(build-in): geosite:telegram, acl:Telegram. Обязательно отключить geoip:telegram.
    · domain_suffix (опционально, для перестраховки): t.me, telegram.org.
    · Идентификатор пакета: com.radolyn.ayugram.
    · Действие: «Автовыбор» или «Текущий сервер».
    
  · Для WhatsApp:
  
    · Rule Set(build-in): geosite:whatsapp.
    · domain_suffix: whatsapp.net, whatsapp.com (оба обязательны из-за блокировки НСДИ).
    · Идентификатор пакета: com.whatsapp.
    · Действие: «Текущий сервер».
    
· AI-сервисы (ChatGPT, Claude, Gemini, Grok и др.):

  · Единой категории geosite:ai нет. Собираем из компонентов:
  
  · Rule Set(build-in): geosite:openai, geosite:anthropic, geosite:google-gemini, geosite:microsoft (для Copilot), geosite:meta, geosite:xai.
  
  · domain_suffix (для отсутствующих в списках): deepseek.com, midjourney.com, x.ai, grok.com.
  
  · Идентификатор пакета (Android): com.openai.chatgpt, com.anthropic.claude, com.microsoft.copilot и т.д.
  
  · Действие: «Текущий сервер».
  
· Прочие заблокированные (YouTube, Discord, Instagram, GitHub):

  · Активировать соответствующие встроенные правила (geosite:youtube, geosite:discord и т.д.) или создать общую группу «Заблокированные» с перечислением нужных категорий. Действие: «Текущий сервер».
  
· Final:

  · Действие: «Текущий сервер». Весь трафик, не попавший в правила, по умолчанию идёт через прокси.
  

**3. DNS: разделение потоков**

Цель: запросы к российским серверам резолвить быстро через локальный DNS, к заблокированным — через зашифрованный туннель.

· Протоколы: Использовать исключительно DNS-over-HTTPS (DoH) (https://). UDP (udp://) не даёт приватности, TLS (tls://) легко блокируется по порту 853, local/dhcp://auto — никакого контроля.

· «DNS-сервер» (для поднятия VPN): Оставить https://223.5.5.5/dns-query (AliDNS).

· «Прокси-сервер» (запасной, Final-трафик): https://1.1.1.1/dns-query (Cloudflare), https://8.8.8.8/dns-query (Google). Выбрать оба для отказоустойчивости.

· «Прямой поток» (для российских сервисов):

  · Основной: https://common.dot.dns.yandex.net/dns-query. Физически в РФ, минимальный пинг.
  
  · Резервные: добавить https://1.1.1.1/dns-query и https://8.8.8.8/dns-query.
  
  · Добавление вручную: через «+» → поле ISP (название), поле URL (адрес).
  
· «Трафик прокси» (для заблокированных): идентично «Прокси-сервер» — Cloudflare + Google.

· Дополнительные настройки:

  · TUN HijackDNS: Включить.
  
  · Включить правила для DNS: Включить (обязательно для разделения потоков).
  
  · [Прямой поток] Включить ECS: Включить.
  
  · [Трафик прокси] Способ разрешения: Не использовать FakeIP. Оставьте поле «Способ разрешения» пустым. Вместо этого включите опцию «[Трафик прокси] Разрешать DNS через прокси-сервер». Это заставит запросы идти стандартным путём через VPN-туннель без нестабильной эмуляции IP.
  
  · TTL: 2h (оптимально для кеширования).
  
  · Предпочитать статическое разрешение IP: Выключить.
  
  · Static IP: Подпункт в разделе DNS. Аналог системного файла hosts — оставьте пустым.

**4. Тонкая настройка TUN**

· Режим TUN: Включить.

· MTU: 1400 (критично для предотвращения фрагментации).

· Строгий маршрут: Включить.

· Стек (Stack): gvisor (максимальная изоляция).

· UDP Тайм-аут: 1 m.

· Примечание: Настройки TLS (фрагментация, гибридный SNI) находятся не в разделе TUN, а в отдельном разделе меню (см. пункт 6).

**5. Управление профилями и автоматический выбор серверов**

· Группы серверов: В разделе «Профили и серверы» можно создавать собственные группы (например, «Стриминг», «Торренты», «Новости») и распределять по ним узлы.

· Режим Autoselect: При выборе для группы режима «Автовыбор» Karing не переключает сервер постоянно. Он лишь переходит на другой узел, если текущий значительно ухудшился или перестал отвечать, либо по расписанию (обычно раз в несколько минут).

Это устраняет проблему «слишком частого переключения», если конфиги корректны.

· Latency Check (URL проверки задержки): Стандартный адрес http://www.gstatic.com/generate_204 иногда нестабилен на ряде прокси. Если вы замечаете частую смену серверов, замените его на один из альтернативных:
  
  · http://www.google.com/generate_204
  
  · http://connect.rom.miui.com/generate_204
  
· Найти настройку: Настройки → Delay Detection URL (или Задержка).

**6. TLS-фрагментация и обход DPI**

· Это отдельный раздел в главном меню настроек, не имеющий отношения к TUN.

· Все опции (фрагментация, гибридный SNI, заполнение) оставить выключенными (по умолчанию). Они предназначены для агрессивного DPI, снижают скорость и стабильность.

**7. Перенос конфигурации и кроссплатформенность**

· Резервное копирование: Настройки → Резервное копирование → Экспорт в файл .zip. Содержит json-профили, правила, ключи.

· Перенос на iPhone (iOS):

  · На Android сгенерировать QR-код в «Синхронизация через LAN».
  
  · На iPhone установить Karing (iOS 15+), отсканировать QR.
  
  · Нюанс: Правила на основе Идентификатор пакета приложения (Android) мигрируют, но на iOS неактивны. Их нужно заменить на domain_suffix-правила вручную (например, для AyuGram — domain_suffix: telegram.org).

**8. Устранение конфликтов с роутером (OpenWrt)**

· Симптом: Госуслуги (и другие российские сервисы) не работают через Wi-Fi, выдавая ошибку «Доступ ограничен по соображениям безопасности».

· Причина: Принудительный DNS-редирект на роутере или конфликт DNS с провайдером.

· Решение:
  · В интерфейсе OpenWrt отключить DNS-редирект: Network → DHCP and DNS → убрать галочку DNS redirect.
  
  · Настроить статические DNS на WAN: Network → Interfaces → WAN → Advanced Settings → Use custom DNS servers добавить 77.88.8.8, 77.88.8.1.
  
  · Перезагрузить роутер.

  ---

</details>


</details>


<details>
<summary><strong><code> Инструкция Exclave </code></strong> ⬅ Нажмите, чтобы открыть </summary>

## `Exclave`

Инструкция по настройке Exclave на Android

### 1. Установка

Скачайте Exclave из [официального репозитория](https://github.com/ExclaveNetwork/Exclave/releases).

### 2. Добавление подписки

1. Скопируйте ссылку подписки.
2. Откройте Exclave.
3. Откройте боковое меню слева `☰`.
4. Перейдите в раздел **Конфигурация**.
5. Нажмите в правом верхнем углу кнопку **Добавить профиль** — значок листа с плюсом.
6. Выберите **Импорт из буфера обмена**.
7. Подтвердите действие кнопкой **Импорт подписки**.
8. Откройте боковое меню слева `☰` → **Группы**.
9. Если возле новой группы написано **Ещё не обновлено**, нажмите кнопку обновления со стрелками.
10. Возле новой группы нажмите на значок карандаша для редактирования.
11. В настройках группы задайте **Имя группы**, **Сортировать** По задержке, в настройках обновления снизу включите **Автоматическое обновление** и задайте **Задержку автоматического обновления (в минутах)** 60 или 120.
12. В правом верхнем углу нажать на галочку, чтобы применить изменения.

После загрузки подписки вернитесь в `☰` → **Конфигурация**

Нажмите `⋮` → **Тест подключения** → **URL test** для первоначального ручного теста. Но обязательно переходим к настройкам ниже в пунктах 3, 4, 5.


### 3. Рекомендуемые настройки

В разделе `☰` → **Настройки** установите:

| Настройка                                             | Значение                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| Сервисный режим                                       | `VPN`                                                              |
| Стек TCP/IP                                           | `gVisor`                                                           |
| Маршрут IPv6                                          | Выключено                                                          |
| Обход LAN                                             | Включено                                                           |
| Стратегия разрешения доменов                          | `AsIs`                                                             |
| Включить анализ трафика                               | Включено                                                           |
| Переопределить назначение                             | Выключено                                                          |
| Режим маршрутов                                       | `правило` для RU-DIRECT или `глобальный` для полного проксирования |
| Удаленный DNS                                         | `https://dns.google/dns-query`                                     |
| Стратегия удалённого DNS                              | `Только IPv4`                                                      |
| Использовать локальный DNS как прямой DNS             | Включено                                                           |
| Стратегия прямого DNS                                 | `Только IPv4`                                                      |
| Использовать системный DNS как DNS начальной загрузки | Включено                                                           |
| Включить маршрутизацию DNS                            | Включено                                                           |
| Включить FakeDNS                                      | Выключено                                                          |

Для режима RU-DIRECT в разделе `☰` → **Маршруты** должны присутствовать правила:

```diff
geosite:category-ru → bypass
geoip:ru            → bypass
geoip:private       → bypass
```

Если эти правила есть, то все ОК.

Если этих правил нет, их необходимо добавить вручную через меню слева сверху `☰` → **Маршруты** → `⋮` → **Импорт из буфера обмена**.

Сами правила RU-DIRECT скопировать отсюда:

```diff
[
  {
    "locked": false,
    "remarks": "RU-DIRECT: локальные и приватные IP",
    "enabled": true,
    "outboundTag": "direct",
    "ip": [
      "geoip:private"
    ]
  },
  {
    "locked": false,
    "remarks": "RU-DIRECT: российские домены",
    "enabled": true,
    "outboundTag": "direct",
    "domain": [
      "geosite:category-ru"
    ]
  },
  {
    "locked": false,
    "remarks": "RU-DIRECT: российские IP",
    "enabled": true,
    "outboundTag": "direct",
    "ip": [
      "geoip:ru"
    ]
  }
]
```

Убедитесь, что появились и включены три правила:
* RU-DIRECT: локальные и приватные IP;
* RU-DIRECT: российские домены;
* RU-DIRECT: российские IP.
В каждом правиле исходящее направление должно отображаться как **Обход**.
Если VPN уже был подключён, отключите и заново включите его.


### 4. Автоматический выбор лучшего узла

Чтобы получить автоматическую health-check-проверку и выбор лучшего узла:

1. Откройте `☰` → **Конфигурация**.
2. Нажмите в правом верхнем углу кнопку **Добавить профиль** — значок листа с плюсом.
3. Выберите **Ручные настройки** → **Балансировщик**.
4. Укажите:

```diff
Имя профиля: Igareck Auto Select
Тип: Группы
Стратегия: leastPing
Группа: выбрать импортированную подписку
Пользовательский URL-адрес проверки подключения: https://www.gstatic.com/generate_204
Интервал между проверками: 300
```

5. Сохраните кнопкой с галочкой (правый верхний угол).
6. В разделе `☰` → **Конфигурация** выберите только что созданный балансировщик.

### 5. Подключение

1. В разделе `☰` → **Конфигурация** выберите отдельный узел для ручного режима или созданный балансировщик `Igareck Auto Select` как активную конфигурацию (рекомендуется).
2. Нажмите кнопку подключения (иконка бумажного самолетика) в нижней части экрана.
3. При первом запуске подтвердите системный запрос Android на создание VPN-подключения.


---

</details>


<details>
<summary><strong><code> Инструкция Shadowrocket </code></strong> ⬅ Нажмите, чтобы открыть </summary>

---

### `Shadowrocket`

https://github.com/hiddify/Hiddify-Manager/wiki/Tutorial-for-ShadowRocket-app

**1. Конфигурационный файл BLACKLIST RU-DIRECT**

**[Скачать Shadowrocket_BL_RU_DIRECT_ROUTING.conf](https://cdn.jsdelivr.net/gh/igareck/GoldCaviar@main/Files/Shadowrocket_BL_RU_DIRECT_ROUTING.conf)**

<details>
<summary><code> Открыть </code></summary>

㋡

```diff
# Shadowrocket RU-DIRECT routing and DNS configuration
#
# ENG
# This file does not contain proxy nodes.
# First add a normal RAW/Base64 subscription to Shadowrocket and configure
# Shadowrocket's native automatic proxy testing/selection. Then import and
# activate this .conf in the Configuration ("Настройка") routing mode.
#
# RU-DIRECT means Russian domains and IP addresses use DIRECT. All other external
# Internet traffic uses PROXY. Localhost, private networks, and LAN devices also
# remain DIRECT so the router and local devices stay reachable.
#
# RU
# Этот файл не содержит прокси-узлов.
# Сначала добавьте в Shadowrocket обычную RAW/Base64-подписку и настройте
# встроенную автоматическую проверку и выбор прокси. Затем импортируйте этот
# файл .conf и активируйте его в режиме маршрутизации «Настройка».
#
# RU-DIRECT означает, что российские домены и IP-адреса направляются через DIRECT.
# Остальной внешний интернет-трафик идёт через PROXY. Localhost, частные сети и
# устройства локальной сети также остаются в режиме DIRECT.
#
# For more information visit: github.com/igareck/vpn-configs-for-russia


[General]

ipv6 = false
prefer-ipv6 = false
ipv6-only-if-no-ipv4-dns = false

private-ip-answer = true
always-ip-address = false
allow-dns-svcb = false
allow-dns-all = true

dns-server = 8.8.8.8,8.8.4.4,9.9.9.9,94.140.14.14,76.76.2.0,76.76.10.0,1.0.0.1,1.1.1.1,208.67.220.220,208.67.222.222,system

fallback-dns-server = system
dns-fallback-system = true

proxy-dns-server = https://dns.google/dns-query#no-h3,https://dns.quad9.net/dns-query#no-h3,https://dns.adguard-dns.com/dns-query#no-h3,https://freedns.controld.com/p0#no-h3,https://dns.mullvad.net/dns-query#no-h3,https://cloudflare-dns.com/dns-query#no-h3,https://doh.opendns.com/dns-query#no-h3,https://doh.libredns.gr/dns-query#no-h3,https://doh.dns4all.eu/dns-query#no-h3,https://wikimedia-dns.org/dns-query#no-h3,https://dns.hostux.net/dns-query#no-h3,https://blank.dnsforge.de/dns-query#no-h3

dns-direct-system = false
dns-direct-fallback-proxy = false
hijack-dns = *:53

always-real-ip = *.lan,*.local,localhost,time.*.com,time.*.gov,time.*.apple.com,time-ios.apple.com,time1.*.com,time2.*.com,time3.*.com,time4.*.com,time5.*.com,time6.*.com,time7.*.com,ntp.*.com,ntp1.*.com,ntp2.*.com,ntp3.*.com,ntp4.*.com,ntp5.*.com,ntp6.*.com,ntp7.*.com,*.pool.ntp.org,push.apple.com,*.push.apple.com,stun.*.*,*.stun.*.*,stun.*.*.*,*.stun.*.*.*,stun.*.*.*.*,*.stun.*.*.*.*,stun.*.*.*.*.*,*.stun.*.*.*.*.*,stun.playstation.net,*.stun.playstation.net,lens.l.google.com,*.n.n.srv.nintendo.net,xbox.*.*.microsoft.com,*.*.xboxlive.com,*.msftncsi.com,*.msftconnecttest.com,WORKGROUP

skip-proxy = 127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,169.254.0.0/16,100.64.0.0/10,localhost,*.local,*.lan

tun-excluded-routes = 10.0.0.0/8,100.64.0.0/10,127.0.0.0/8,169.254.0.0/16,172.16.0.0/12,192.0.0.0/24,192.0.2.0/24,192.88.99.0/24,192.168.0.0/16,198.51.100.0/24,203.0.113.0/24,224.0.0.0/4,239.255.255.250/32,255.255.255.255/32

udp-policy-not-supported-behaviour = REJECT
block-quic = always-allow
use-local-host-item-for-proxy = true
icmp-auto-reply = false
always-reject-url-rewrite = false

[Rule]

DOMAIN,localhost,DIRECT
DOMAIN-SUFFIX,local,DIRECT
DOMAIN-SUFFIX,lan,DIRECT

IP-CIDR,127.0.0.0/8,DIRECT,no-resolve
IP-CIDR,10.0.0.0/8,DIRECT,no-resolve
IP-CIDR,172.16.0.0/12,DIRECT,no-resolve
IP-CIDR,192.168.0.0/16,DIRECT,no-resolve
IP-CIDR,169.254.0.0/16,DIRECT,no-resolve
IP-CIDR,100.64.0.0/10,DIRECT,no-resolve

IP-CIDR,::1/128,DIRECT,no-resolve
IP-CIDR,fc00::/7,DIRECT,no-resolve
IP-CIDR,fe80::/10,DIRECT,no-resolve

# Remove the next 3 lines for Global / Not-RU-Direct routing.
DOMAIN-SUFFIX,ru,DIRECT
DOMAIN-SUFFIX,xn--p1ai,DIRECT
GEOIP,RU,DIRECT

FINAL,PROXY

[Host]

localhost = 127.0.0.1
```

</details>


**2. Конфигурационный файл BLACKLIST GLOBAL**

**[Скачать Shadowrocket_BL_GLOBAL_ROUTING.conf](https://cdn.jsdelivr.net/gh/igareck/GoldCaviar@main/Files/Shadowrocket_BL_GLOBAL_ROUTING.conf)**

<details>
<summary><code> Открыть </code></summary>

㋡

```diff
# Shadowrocket GLOBAL routing and DNS configuration
#
# ENG
# This file does not contain proxy nodes.
# First add a normal RAW/Base64 subscription to Shadowrocket and configure
# Shadowrocket's native automatic proxy testing/selection. Then import and
# activate this .conf in the Configuration ("Настройка") routing mode.
#
# GLOBAL means all external Internet traffic uses PROXY. Localhost, private
# networks, and LAN devices remain DIRECT so the router and local devices stay
# reachable.
#
# RU
# Этот файл не содержит прокси-узлов.
# Сначала добавьте в Shadowrocket обычную RAW/Base64-подписку и настройте
# встроенную автоматическую проверку и выбор прокси. Затем импортируйте этот
# файл .conf и активируйте его в режиме маршрутизации «Настройка».
#
# GLOBAL означает, что весь внешний интернет-трафик направляется через PROXY.
# Localhost, частные сети и устройства локальной сети остаются в режиме DIRECT,
# чтобы сохранить доступ к роутеру и другим локальным устройствам.
#
# For more information visit: github.com/igareck/vpn-configs-for-russia

[General]

ipv6 = false
prefer-ipv6 = false
ipv6-only-if-no-ipv4-dns = false

private-ip-answer = true
always-ip-address = false
allow-dns-svcb = false
allow-dns-all = true

dns-server = 8.8.8.8,8.8.4.4,9.9.9.9,94.140.14.14,76.76.2.0,76.76.10.0,1.0.0.1,1.1.1.1,208.67.220.220,208.67.222.222,system

fallback-dns-server = system
dns-fallback-system = true

proxy-dns-server = https://dns.google/dns-query#no-h3,https://dns.quad9.net/dns-query#no-h3,https://dns.adguard-dns.com/dns-query#no-h3,https://freedns.controld.com/p0#no-h3,https://dns.mullvad.net/dns-query#no-h3,https://cloudflare-dns.com/dns-query#no-h3,https://doh.opendns.com/dns-query#no-h3,https://doh.libredns.gr/dns-query#no-h3,https://doh.dns4all.eu/dns-query#no-h3,https://wikimedia-dns.org/dns-query#no-h3,https://dns.hostux.net/dns-query#no-h3,https://blank.dnsforge.de/dns-query#no-h3

dns-direct-system = false
dns-direct-fallback-proxy = false
hijack-dns = *:53

always-real-ip = *.lan,*.local,localhost,time.*.com,time.*.gov,time.*.apple.com,time-ios.apple.com,time1.*.com,time2.*.com,time3.*.com,time4.*.com,time5.*.com,time6.*.com,time7.*.com,ntp.*.com,ntp1.*.com,ntp2.*.com,ntp3.*.com,ntp4.*.com,ntp5.*.com,ntp6.*.com,ntp7.*.com,*.pool.ntp.org,push.apple.com,*.push.apple.com,stun.*.*,*.stun.*.*,stun.*.*.*,*.stun.*.*.*,stun.*.*.*.*,*.stun.*.*.*.*,stun.*.*.*.*.*,*.stun.*.*.*.*.*,stun.playstation.net,*.stun.playstation.net,lens.l.google.com,*.n.n.srv.nintendo.net,xbox.*.*.microsoft.com,*.*.xboxlive.com,*.msftncsi.com,*.msftconnecttest.com,WORKGROUP

skip-proxy = 127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,169.254.0.0/16,100.64.0.0/10,localhost,*.local,*.lan

tun-excluded-routes = 10.0.0.0/8,100.64.0.0/10,127.0.0.0/8,169.254.0.0/16,172.16.0.0/12,192.0.0.0/24,192.0.2.0/24,192.88.99.0/24,192.168.0.0/16,198.51.100.0/24,203.0.113.0/24,224.0.0.0/4,239.255.255.250/32,255.255.255.255/32

udp-policy-not-supported-behaviour = REJECT
block-quic = always-allow
use-local-host-item-for-proxy = true
icmp-auto-reply = false
always-reject-url-rewrite = false

[Rule]

DOMAIN,localhost,DIRECT
DOMAIN-SUFFIX,local,DIRECT
DOMAIN-SUFFIX,lan,DIRECT

IP-CIDR,127.0.0.0/8,DIRECT,no-resolve
IP-CIDR,10.0.0.0/8,DIRECT,no-resolve
IP-CIDR,172.16.0.0/12,DIRECT,no-resolve
IP-CIDR,192.168.0.0/16,DIRECT,no-resolve
IP-CIDR,169.254.0.0/16,DIRECT,no-resolve
IP-CIDR,100.64.0.0/10,DIRECT,no-resolve

IP-CIDR,::1/128,DIRECT,no-resolve
IP-CIDR,fc00::/7,DIRECT,no-resolve
IP-CIDR,fe80::/10,DIRECT,no-resolve

FINAL,PROXY

[Host]

localhost = 127.0.0.1
```

</details>

**3. Конфигурационный файл WHITELIST**

**[Скачать Shadowrocket_WL_GLOBAL_ROUTING.conf](https://cdn.jsdelivr.net/gh/igareck/GoldCaviar@main/Files/Shadowrocket_WL_GLOBAL_ROUTING.conf)**

<details>
<summary><code> Открыть </code></summary>

㋡

```diff
# Shadowrocket WHITELIST GLOBAL routing and DNS configuration
#
# ENG
# This file does not contain proxy nodes.
# First add a normal RAW/Base64 WHITELIST subscription to Shadowrocket and
# configure Shadowrocket's native automatic proxy testing/selection. Then
# import and activate this .conf in the Configuration ("Настройка") routing
# mode.
#
# WHITELIST GLOBAL means all external Internet traffic uses PROXY. Localhost,
# private networks, and LAN devices remain DIRECT so the router and local
# devices stay reachable.
#
# Russian and system DNS resolvers are used directly for bootstrap and DIRECT
# lookups. External DNS lookups for proxied traffic use DoH through PROXY.
#
# RU
# Этот файл не содержит прокси-узлов.
# Сначала добавьте в Shadowrocket обычную RAW/Base64-подписку WHITELIST и
# настройте встроенную автоматическую проверку и выбор прокси. Затем
# импортируйте этот файл .conf и активируйте его в режиме маршрутизации
# «Настройка».
#
# WHITELIST GLOBAL означает, что весь внешний интернет-трафик направляется
# через PROXY. Localhost, частные сети и устройства локальной сети остаются в
# режиме DIRECT, чтобы сохранить доступ к роутеру и другим локальным
# устройствам.
#
# Российские и системный DNS используются напрямую для bootstrap и запросов
# DIRECT. Зарубежные DoH для трафика PROXY доступны через прокси.
#
# For more information visit: github.com/igareck/vpn-configs-for-russia

[General]

ipv6 = false
prefer-ipv6 = false
ipv6-only-if-no-ipv4-dns = false

private-ip-answer = true
always-ip-address = false
allow-dns-svcb = false
allow-dns-all = true

dns-server = system,https://common.dot.dns.yandex.net/dns-query#no-h3,https://safe.dot.dns.yandex.net/dns-query#no-h3,https://family.dot.dns.yandex.net/dns-query#no-h3,77.88.8.1,77.88.8.2,77.88.8.3,77.88.8.7,77.88.8.8,77.88.8.88,89.175.167.27,94.72.28.59,95.31.212.206,82.140.107.246,83.149.26.2,188.162.79.131

fallback-dns-server = system
dns-fallback-system = true

proxy-dns-server = https://dns.google/dns-query#no-h3,https://dns.quad9.net/dns-query#no-h3,https://dns.adguard-dns.com/dns-query#no-h3,https://freedns.controld.com/p0#no-h3,https://dns.mullvad.net/dns-query#no-h3,https://cloudflare-dns.com/dns-query#no-h3,https://doh.opendns.com/dns-query#no-h3,https://doh.libredns.gr/dns-query#no-h3,https://doh.dns4all.eu/dns-query#no-h3,https://wikimedia-dns.org/dns-query#no-h3,https://dns.hostux.net/dns-query#no-h3,https://blank.dnsforge.de/dns-query#no-h3

dns-direct-system = false
dns-direct-fallback-proxy = false
hijack-dns = *:53

always-real-ip = *.lan,*.local,localhost,time.*.com,time.*.gov,time.*.apple.com,time-ios.apple.com,time1.*.com,time2.*.com,time3.*.com,time4.*.com,time5.*.com,time6.*.com,time7.*.com,ntp.*.com,ntp1.*.com,ntp2.*.com,ntp3.*.com,ntp4.*.com,ntp5.*.com,ntp6.*.com,ntp7.*.com,*.pool.ntp.org,push.apple.com,*.push.apple.com,stun.*.*,*.stun.*.*,stun.*.*.*,*.stun.*.*.*,stun.*.*.*.*,*.stun.*.*.*.*,stun.*.*.*.*.*,*.stun.*.*.*.*.*,stun.playstation.net,*.stun.playstation.net,lens.l.google.com,*.n.n.srv.nintendo.net,xbox.*.*.microsoft.com,*.*.xboxlive.com,*.msftncsi.com,*.msftconnecttest.com,WORKGROUP

skip-proxy = 127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,169.254.0.0/16,100.64.0.0/10,localhost,*.local,*.lan

tun-excluded-routes = 10.0.0.0/8,100.64.0.0/10,127.0.0.0/8,169.254.0.0/16,172.16.0.0/12,192.0.0.0/24,192.0.2.0/24,192.88.99.0/24,192.168.0.0/16,198.51.100.0/24,203.0.113.0/24,224.0.0.0/4,239.255.255.250/32,255.255.255.255/32

udp-policy-not-supported-behaviour = REJECT
block-quic = always-allow
use-local-host-item-for-proxy = true
icmp-auto-reply = false
always-reject-url-rewrite = false

[Rule]

DOMAIN,localhost,DIRECT
DOMAIN-SUFFIX,local,DIRECT
DOMAIN-SUFFIX,lan,DIRECT

IP-CIDR,127.0.0.0/8,DIRECT,no-resolve
IP-CIDR,10.0.0.0/8,DIRECT,no-resolve
IP-CIDR,172.16.0.0/12,DIRECT,no-resolve
IP-CIDR,192.168.0.0/16,DIRECT,no-resolve
IP-CIDR,169.254.0.0/16,DIRECT,no-resolve
IP-CIDR,100.64.0.0/10,DIRECT,no-resolve

IP-CIDR,::1/128,DIRECT,no-resolve
IP-CIDR,fc00::/7,DIRECT,no-resolve
IP-CIDR,fe80::/10,DIRECT,no-resolve

FINAL,PROXY

[Host]

localhost = 127.0.0.1
```

</details>

---

</details>


<details>
<summary><strong><code> Инструкция v2rayN, v2rayNG </code></strong> ⬅ Нажмите, чтобы открыть </summary>

---

### `v2rayN, v2rayNG`

**[Настройка V2rayN на Windows (зеркало)](https://web.archive.org/web/https://vpnpanels.com/ru/p/setup-v2ray-windows)**

**[Настройка V2rayNG на Android (зеркало)](https://web.archive.org/web/https://vpnpanels.com/ru/p/setup-v2ray-android/)**

<details>
<summary><strong><code> v2rayN — НАСТРОЙКИ КЛИЕНТА 1 </code></strong> ⬅ Нажмите, чтобы открыть </summary>

---

Установите официальный клиент v2rayN, запустите в "режиме Администратора".

Зайдите в "Настройки" - "Региональные пресеты", выберите "Россия". Нажмите на меню "перезагрузка" или перезапустите приложение.

Добавьте подписку через **Группа подписки - Настройки группы подписки**, загрузите подписку через **Группа подписки - Обновить текущую подписку без прокси**, появится список.

Нажмите на проверку "Реальной задержки" (значок молнии сверху справа), после завершения - отсортируйте по пингу, выберите несколько верхних зеленых конфигов с наименьшим числом.

Выделите несколько серверов с наименьшим числом пинга, нажмите правую клавишу мышки, выберите "Тест на скорость загрузки сервера", после теста выберите самый быстрый, нажав на нем Enter. Но тест скорости v2rayN в последнее время показывает ложные результаты даже на живых серверах, поэтому я бы спокойно ориентировался на пинг. В моих подписках, если сервер пингуется, то должен работать априори.

В конце запустите "Режим VPN/Режим TUN", либо активируйте "Установить системный прокси". Справа выберите правила маршрутизации "RUv1-Все, кроме РФ", чтобы VPN не применялся для работы на RU-сайтах.

---

</details>

<details>
<summary><strong><code> v2rayN — НАСТРОЙКИ КЛИЕНТА 2 </code></strong> ⬅ Нажмите, чтобы открыть </summary>

---

**v2rayN — НАСТРОЙКИ КЛИЕНТА**

Версия интерфейса, по которой составлена инструкция: v2rayN 7.24.4. 

Язык интерфейса - английский.

Готовые строки ниже копируются в указанные поля v2rayN, а переключатели устанавливаются один раз вручную.


**`1. DNS SETTINGS`**

**Путь: Settings -> DNS Settings -> Basic DNS Settings**

**Domestic DNS**

Для подписок BLACKLIST:

```diff
8.8.8.8,8.8.4.4,9.9.9.9,94.140.14.14,76.76.2.0,76.76.10.0,1.0.0.1,1.1.1.1,208.67.220.220,208.67.222.222
```

Для подписок WHITELIST:

```diff
localhost,https://common.dot.dns.yandex.net/dns-query,https://safe.dot.dns.yandex.net/dns-query,https://family.dot.dns.yandex.net/dns-query
```

**Remote DNS**

Для любых подписок:

```diff
https://dns.google/dns-query,https://dns.quad9.net/dns-query,https://dns.adguard-dns.com/dns-query,https://freedns.controld.com/p0,https://dns.mullvad.net/dns-query,https://cloudflare-dns.com/dns-query,https://doh.opendns.com/dns-query,https://doh.libredns.gr/dns-query,https://doh.dns4all.eu/dns-query,https://wikimedia-dns.org/dns-query,https://dns.hostux.net/dns-query,https://blank.dnsforge.de/dns-query
```

**Bootstrap DNS**

Для подписок BLACKLIST:

```diff
8.8.8.8,8.8.4.4,9.9.9.9,94.140.14.14,76.76.2.0,76.76.10.0,1.0.0.1,1.1.1.1,208.67.220.220,208.67.222.222
```

Для подписок WHITELIST:

```diff
77.88.8.1,77.88.8.2,77.88.8.3,77.88.8.7,77.88.8.8,77.88.8.88,89.175.167.27,94.72.28.59,95.31.212.206,82.140.107.246,83.149.26.2,188.162.79.131
```

**Остальные параметры Basic DNS Settings:**

```diff
• Direct Target Resolution Strategy: UseIPv4
• Proxy Target Resolution Strategy: UseIPv4
• Proxy Dial Resolution Strategy: AsIs или пустое значение
• Parallel Query: Off
• Serve Stale: Off
• Enable Happy Eyeballs: Off
```

Не устанавливайте Proxy Dial Resolution Strategy в UseIPv4: интерфейс v2rayN
предупреждает, что эта стратегия способна вызвать цикл маршрутизации.


**`2. ADVANCED DNS SETTINGS`**

**Путь: Settings -> DNS Settings -> Advanced DNS Settings**

```diff
• Use System Hosts: On
• Add Common DNS Hosts: On
• FakeIP: Off
• Block SVCB and HTTPS Queries: On
• Validate Regional Domain IPs: оставить пустым
• DNS Hosts: оставить пустым
```

FakeIP оставлен выключенным: в интерфейсе v2rayN полноценный список исключений
FakeIP доступен для sing-box, а этот публичный профиль использует Xray.


**`3. CUSTOM DNS`**

**Путь: Settings -> DNS Settings -> V2ray Custom DNS**

Оставьте выключенными:

```diff
• V2ray Custom DNS -> HTTP/SOCKS: Enable = Off
• sing-box Custom DNS -> HTTP/SOCKS: Enable = Off
```

Кнопка "Click to import default DNS config" загружает встроенный шаблон v2rayN.
Отдельный пользовательский JSON с диска через неё не импортируется.


**`4. CORE: BASIC SETTINGS`**

**Путь: Settings -> Option Setting -> Core: basic settings**

```diff
• Enable UDP: On
• Turn on Sniffing: On
• Sniffing type: http, tls, quic
• Route Only: Off
• Allow connections from the LAN: Off
• Enable fragment: Off
```

Если вы намеренно раздаёте прокси другим устройствам локальной сети, параметр
Allow connections from the LAN настраивается отдельно с учётом безопасности.


**`5. V2RAYN SETTINGS`**


**Путь: Settings -> Option Setting -> v2rayN Settings**

```diff
• Speed Ping Test URL: https://www.gstatic.com/generate_204
• Automatic update interval for Geo files: 24 часа
• Number of concurrent tests during multi-test: 5
```

**`6. SUBSCRIPTION GROUP SETTINGS`**

**Путь: Subscription Group -> Subscription Group settings -> *Group* -> Edit** 

```diff
• Automatic update interval: 60 минут
```

Интервал обновления подписки можно увеличить до 120 минут.


**`7. TUN MODE SETTINGS`**

**Путь: Settings -> Option Setting -> TUN Mode settings**

```diff
• Auto Route: On
• Strict Route: On
• Stack: gvisor
• MTU: 4000
• Enable IPv6 Address: Off
• Legacy TUN Protect: On
```


**`8. МАРШРУТИЗАЦИЯ RU-DIRECT`**

**Путь: Settings -> Regional presets setting -> Russia**


**`9. ОБНОВЛЕНИЕ`**

**Путь: Help -> Check Update**

Обновите компоненты клиента.

Затем нажмите на кнопку Reload в верхнем меню.


**`10. ПРИМЕНЕНИЕ`**

• Нажмите Confirm во всех изменённых окнах.

• Нажмите Reload или переподключите v2rayN.

• Маршрутизация RU-DIRECT выбирается непосредственно в v2rayN.

• Активируется RU-DIRECT справа от кнопки Enable TUN: выбрать "RUv1-Все, кроме РФ".

• Для GLOBAL выберите "RUv1-Все".

---

</details>

---

</details>

---

## 🚀 Рекомендованные утилиты для обхода блокировок РКН (Без VPN)

Если вам не нужен полноценный VPN, а требуется только вернуть доступ к заблокированным ресурсам (например, YouTube и Discord), настоятельно рекомендуем использовать локальные средства обхода DPI:

* **💻 На ПК (Windows):** **zapret** — отличный обход TCПУ
  👉 [Скачать последнюю версию zapret для ПК](https://github.com/Flowseal/zapret-discord-youtube)
  
  👉 [Лучший пошаговый гайл на Zapret](https://github.com/vpnsvpns/Prihs/blob/main/zapret.md)

* **🤖 На Android:** **ByeByeDPI** — легкий и эффективный локальный прокси-клиент против ТСПУ.  
  👉 [Скачать последнюю версию ByeByeDPI для Android](https://github.com/romanvht/ByeByeDPI/releases)
  👉[Обход белых списков через ByeByeDPI и его настройка если не работает](https://youtu.be/N2Ds6xfh6KY)

---

## 📋 Вечно актуальные VPN-подписки

> **💡 Важно о списках:** Наши сабки универсальны. Они отлично подходят как для **Черных списков** (когда заблокированы только отдельные сайты, например, Instagram, X, Discord), так и для **Белых списков** (когда мобильный интернет жестко ограничен провайдерами и работают только одобренные ресурсы вроде Госуслуг и ВК).

👉 [Стабильный обход белых списков на Android и IOS](https://github.com/vpnsvpns/Prihs/blob/main/vk.md)

Копируйте ссылки ниже вручную и вставляйте в свои VPN-клиенты (Выбирайте клиент из рекомендованых ниже). Если вы настраиваете со телефона, можете отсканировать **QR-код** в своём VPN клиенте:

### 💾 Главная актуальная сабка
https://vpnsvpns.github.io/Prihs/mifa.json
<details>
<summary>📱 Показать QR-код</summary>

<img src="https://github.com/vpnsvpns/Prihs/blob/main/qr-codes/mifa.png?raw=true" width="220" height="220" alt="QR Главная сабка">
</details>

### 💾 Резервная сабка (Ros)
https://vpnsvpns.github.io/Prihs/ros.json
<details>
<summary>📱 Показать QR-код</summary>

<img src="https://github.com/vpnsvpns/Prihs/blob/main/qr-codes/ros.png?raw=true?raw=true" width="220" height="220" alt="QR Резервная сабка">
</details>

### 💾 Дополнительная сабка (White для белых списков)
https://vpnsvpns.github.io/Prihs/white.json
<details>
<summary>📱 Показать QR-код</summary>

<img src="https://github.com/vpnsvpns/Prihs/blob/main/qr-codes/white.png?raw=true" width="220" height="220" alt="QR Дополнительная сабка">
</details>

---

## ✈️ Прокси для Telegram

> **💡 Совет по подключению:** Скопируйте ссылку, отправьте её себе в избранное в Telegram и перейдите по ней. Так же можно скопировать ссылку и вставить её в адрессную строку в вашем браузере и перейти.

> **📢 Рекомендация для обхода блокировок стандартных MTProto:** Используйте стабильный **TG WS PROXY** (работает через протокол WebSockets, который провайдерам сложнее обнаружить):
> * **💻 На ПК:** [tg-ws-proxy для ПК](https://sourceforge.net/projects/tg-ws-proxy.mirror/files/)
> * **🤖 На Android:** [tg-ws-proxy-android для Android](https://github.com/amurcanov/tg-ws-proxy-android)

**ИЩЕМ ПРОКСИ НОВЫЕ ПРОКСИ В БОТЕ - @proxselink_bot!**

### ⚡ Обычные прокси

| Название | Автоматическое подключение | Скопировать ссылку для браузера |
| :--- | :---: | :--- |
| **Прокси 1** | [🚀 Применить по клику](https://t.me/proxy?server=fast.prx.mom&port=443&secret=7kq1fXSW-o_tP8LNHOpu4bdmYXN0LnByeC5tb20) | `tg://proxy?server=fast.prx.mom&port=443&secret=7kq1fXSW-o_tP8LNHOpu4bdmYXN0LnByeC5tb20` |
| **Прокси 2** | [🚀 Применить по клику](https://t.me/proxy?server=nya-nya.top&port=853&secret=7lTOMw5GkMwpfSsDH_PyiLBtdC5ha2VuYWkuY2xpY2s) | `tg://proxy?server=nya-nya.top&port=853&secret=7lTOMw5GkMwpfSsDH_PyiLBtdC5ha2VuYWkuY2xpY2s` |
| **Прокси 3** | [🚀 Применить по клику](https://t.me/proxy?server=93.77.178.245&port=443&secret=ee676f6f676c652e636f6d749d157e2d) | `tg://proxy?server=93.77.178.245&port=443&secret=ee676f6f676c652e636f6d749d157e2d` |
| **Прокси 4** | [🚀 Применить по клику](https://t.me/proxy?server=predator-artist.top&port=853&secret=7lTOMw5GkMwpfSsDH_PyiLBtdC5ha2VuYWkuY2xpY2s) | `tg://proxy?server=predator-artist.top&port=853&secret=7lTOMw5GkMwpfSsDH_PyiLBtdC5ha2VuYWkuY2xpY2s` |
| **Прокси 5** | [🚀 Применить по клику](https://t.me/proxy?server=akenai.top&port=853&secret=7lTOMw5GkMwpfSsDH_PyiLBtdC5ha2VuYWkuY2xpY2s) | `tg://proxy?server=akenai.top&port=853&secret=7lTOMw5GkMwpfSsDH_PyiLBtdC5ha2VuYWkuY2xpY2s` |
| **Прокси 6** | [🚀 Применить по клику](https://t.me/proxy?server=focus-ultimate.top&port=853&secret=7lTOMw5GkMwpfSsDH_PyiLBtdC5ha2VuYWkuY2xpY2s) | `tg://proxy?server=focus-ultimate.top&port=853&secret=7lTOMw5GkMwpfSsDH_PyiLBtdC5ha2VuYWkuY2xpY2s` |
| **Прокси 7** | [🚀 Применить по клику](https://t.me/proxy?server=cover-acid.top&port=853&secret=7lTOMw5GkMwpfSsDH_PyiLBtdC5ha2VuYWkuY2xpY2s) | `tg://proxy?server=cover-acid.top&port=853&secret=7lTOMw5GkMwpfSsDH_PyiLBtdC5ha2VuYWkuY2xpY2s` |
| **Прокси 8** | [🚀 Применить по клику](https://t.me/proxy?server=skill-issue.top&port=853&secret=7lTOMw5GkMwpfSsDH_PyiLBtdC5ha2VuYWkuY2xpY2s) | `tg://proxy?server=skill-issue.top&port=853&secret=7lTOMw5GkMwpfSsDH_PyiLBtdC5ha2VuYWkuY2xpY2s` |
| **Прокси 9** | [🚀 Применить по клику](https://t.me/proxy?server=i-love-femboys.top&port=853&secret=7lTOMw5GkMwpfSsDH_PyiLBtdC5ha2VuYWkuY2xpY2s) | `tg://proxy?server=i-love-femboys.top&port=853&secret=7lTOMw5GkMwpfSsDH_PyiLBtdC5ha2VuYWkuY2xpY2s` |
| **Прокси 10** | [🚀 Применить по клику](https://t.me/proxy?server=t.meow-network.com&port=443&secret=7lYi4R__Pkm8yFKAGXphBrV0Lm1lb3ctbmV0d29yay5jb20) | `tg://proxy?server=t.meow-network.com&port=443&secret=7lYi4R__Pkm8yFKAGXphBrV0Lm1lb3ctbmV0d29yay5jb20` |
| **Прокси 11** | [🚀 Применить по клику](https://t.me/proxy?server=proxtstar.live&port=443&secret=7moDM8HbP46rpcdnMaRCA7Zhdml0by5ydQ) | `tg://proxy?server=proxtstar.live&port=443&secret=7moDM8HbP46rpcdnMaRCA7Zhdml0by5ydQ` |
| **Прокси 12** | [🚀 Применить по клику](https://t.me/proxy?server=nngo.cc&port=443&secret=ddf390d9757cb92d87826bcef28a6e75ed) | `tg://proxy?server=nngo.cc&port=443&secret=ddf390d9757cb92d87826bcef28a6e75ed` |
| **Прокси 13** | [🚀 Применить по клику](https://t.me/proxy?server=85.192.34.18&port=9443&secret=7vOQ2XV8uS2HgmvO8opude10Z25uLmxpdmU) | `tg://proxy?server=85.192.34.18&port=9443&secret=7vOQ2XV8uS2HgmvO8opude10Z25uLmxpdmU` |
| **Прокси 14** | [🚀 Применить по клику](https://t.me/proxy?server=proxy.trost-shield.ru&port=443&secret=ddb7de28881418c53c6fb2d216fc4a385c) | `tg://proxy?server=proxy.trost-shield.ru&port=443&secret=ddb7de28881418c53c6fb2d216fc4a385c` |
| **Прокси 15** | [🚀 Применить по клику](https://t.me/proxy?server=nnmm.me&port=443&secret=ddf390d9757cb92d87826bcef28a6e75ed) | `tg://proxy?server=nnmm.me&port=443&secret=ddf390d9757cb92d87826bcef28a6e75ed` |
| **Прокси 16** | [🚀 Применить по клику](https://t.me/proxy?server=tgnn.live&port=9443&secret=7vOQ2XV8uS2HgmvO8opude10Z25uLmxpdmU) | `tg://proxy?server=tgnn.live&port=9443&secret=7vOQ2XV8uS2HgmvO8opude10Z25uLmxpdmU` |
| **Прокси 17** | [🚀 Применить по клику](https://t.me/proxy?server=85.192.35.94&port=443&secret=ddf390d9757cb92d87826bcef28a6e75ed) | `tg://proxy?server=85.192.35.94&port=443&secret=ddf390d9757cb92d87826bcef28a6e75ed` |

### 🛡️ Прокси для «Белых списков» (Работает и на обычном интернете)

**СТАБИЛЬНЫХ СЕЙЧАС НЕТУ**

## 🎯 DNS для Игр (Brawl Stars и другие) и ИИ (Gemini и Другие)

[Обход блокировок нейросетей и много чего ещё без VPN на пк](https://github.com/AvenCores/Goida-AI-Unlocker)

[Как обойти ошибку входа в Antigravity](https://github.com/AvenCores/open-antigravity-patcher) 👉 [Гайд на фикс Antigravity](https://www.youtube.com/watch?v=hMOeXUQHy4I&t=3s)

*Это не топ, а просто рабочий список доступных альтернатив.*

**Android:** Это DNS-over-TLS

### 1. XboxDNS

* 🍏 **iOS:** [Скачать профиль](https://xbox-dns.ru/xbox-dns.mobileconfig?s=supercell) (Для игр Supercell)
* 🍏 **iOS:** [Скачать профиль](https://xbox-dns.ru/xbox-dns.mobileconfig)
* 🤖 **Android:** `supercell.xbox-dns.ru` (Для игр Supercell)
* 🤖 **Android:** `xbox-dns.ru`
* **DNS-over-HTTPS:** `https://xbox-dns.ru/dns-query`
* **IPV4:** `11.88.96.50`
* **IPV4:** `111.88.96.51`      

### 2. MafioznikDNS

* 🍏 **iOS:** [Скачать профиль](https://freedom.mafioznik.xyz/file/mafia-dns.mobileconfig)
* 🤖 **Android 1:** `dns.mafioznik.xyz`
* 🤖 **Android 2:** `dns2.mafioznik.xyz`
* **DNS-over-HTTPS:** `https://dns.mafioznik.xyz/dns-query`
* **IPV4:** `103.27.157.38`
* **IPV4:** `103.27.157.100` 

### 3. Malw Link

* 🍏 **iOS:** [Скачать профиль](https://info.dns.malw.link/dns.malw.link.mobileconfig)
* 🍏 **iOS:** [Скачать профиль](https://info.dns.malw.link/dns.malw.link_cloudflare.mobileconfig) (На Cloudflare Gateway)
* 🤖 **Android:** `dns.malw.link`
* 🤖 **Android:** `5u35p8m9i7.cloudflare-gateway.com` (На Cloudflare Gateway)
* **DNS-over-HTTPS:** `https://dns.malw.link/dns-query`
* **DNS-over-HTTPS:** `https://5u35p8m9i7.cloudflare-gateway.com/dns-query` (На Cloudflare Gateway)
* **IPV4:** `80.253.249.40`
* **IPV4:** `193.23.209.189` 


### 4. GeoHide

* 🤖 **Android:** `dns.geohide.ru`
* **DNS-over-HTTPS:** `https://dns.geohide.ru:444/dns-query`
* **IPV4:** `45.155.204.190`
* **IPV4:** `37.230.192.51` 


### 5. AstacatDNS

* 🍏 **iOS:** [Скачать профиль](https://cdn.jsdelivr.net/gh/ASTRACAT2022/IOS-DNS@main/astracat-doh.mobileconfig)
* 🤖 **Android:** `dns.astracat.ru`
* **DNS-over-HTTPS:** `https://dns.astracat.ru/dns-query`
* **IPV4:** `77.239.113.0`
* **IPV4:** `108.165.164.201` 

> **⚠️ Важно:** Ссылки на профили нужно открывать **строго в Safari**. Через встроенные браузеры Telegram или VK файл не скачается!

1. Открой Safari и перейди по ссылке выбранного DNS-профиля.
2. Файл скачается автоматически.
3. Зайди в стандартное приложение **«Файлы»** -> **Загрузки** и найди скачанный `.mobileconfig` файл.
4. Нажми на файл и выбери **«Установить профиль»**.
5. Перейди в главные **Настройки смартфона** -> сверху появится пункт **«Профиль загружен»** -> подтверди установку кнопкой **«Установить»**.

---

## 📺 IPTV

Телевизионные каналы на русском языке, которые официально ушли из России (Cartoon Network как пример)

👉 [Сам гайд на IPTV](https://github.com/vpnsvpns/Prihs/blob/main/iptv.md)

