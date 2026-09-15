#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
mifa.json (строки vless:// vmess:// trojan:// ss://, base64-блобы или JSON) -> mifa.yaml (Mihomo/Clash Meta)
Запуск локально:  python3 convert_mifa.py
Env: NODE_PREFIX (имя нод, default "Prihs"), RU_DIRECT (1/0, default 1), SRC, DST
Без внешних зависимостей (PyYAML не нужен).
"""
import base64, json, os, re, sys, urllib.parse
from datetime import datetime, timezone

SRC      = os.environ.get("SRC", "mifa.json")
DST      = os.environ.get("DST", "mifa.yaml")
PREFIX   = os.environ.get("NODE_PREFIX", "Prihs")
RU_DIRECT = os.environ.get("RU_DIRECT", "1") not in ("0", "false", "no")

SCHEME_RE = re.compile(r'^(vless|vmess|trojan|ss)://', re.I)
B64_RE    = re.compile(r'^[A-Za-z0-9+/=_-]{80,}={0,2}$')
RESERVED  = {"true","false","null","yes","no","on","off","~","","y","n"}

# ---------- utils ----------
def b64d(s: str) -> str:
    s = s.strip().replace('-', '+').replace('_', '/')
    s += '=' * (-len(s) % 4)
    return base64.b64decode(s).decode('utf-8', 'ignore')

def collect_texts(raw: str):
    raw = raw.strip()
    if raw.startswith('#'):  # комментарии в начале -> убираем до первого пустого/ссылки
        pass
    try:
        data = json.loads(raw)
        out = []
        def walk(x):
            if isinstance(x, str): out.append(x)
            elif isinstance(x, dict):
                for v in x.values(): walk(v)
            elif isinstance(x, list):
                for v in x: walk(v)
        walk(data)
        if out: return out
    except Exception:
        pass
    return [ln.strip() for ln in raw.splitlines()]

def expand_uris(texts):
    uris = []
    for t in texts:
        t = t.strip()
        if not t or t.startswith('#'): continue
        if SCHEME_RE.match(t):
            uris.append(t)
        elif B64_RE.match(t):
            try: dec = b64d(t)
            except Exception: continue
            uris += [ln.strip() for ln in dec.splitlines() if SCHEME_RE.match(ln.strip())]
        else:
            m = SCHEME_RE.search(t)
            if m: uris.append(t[m.start():])
    return uris

def _host_port(hp, default=443):
    hp = hp.strip()
    if hp.startswith('['):
        host, _, rest = hp[1:].partition(']')
        port = rest.lstrip(':')
    else:
        host, _, port = hp.rpartition(':')
        if not host: host, port = hp, ''
    try: port = int(port)
    except ValueError: port = default
    return host, port

def _p(params, k, d=None):
    v = params.get(k)
    return v[0] if v else d

def _alpn(s):
    return [a.strip() for a in s.split(',') if a.strip()] if s else None

def _split_uri(u, scheme):
    body = u[len(scheme)+3:]
    frag = ''
    if '#' in body: body, frag = body.split('#', 1); frag = urllib.parse.unquote(frag)
    params = {}
    if '?' in body: body, qs = body.split('?', 1); params = urllib.parse.parse_qs(qs, keep_blank_values=True)
    return body, params, frag

def _ws(n, params, host, sni):
    n['network'] = 'ws'
    wo = {'path': _p(params, 'path', '/') or '/'}
    hdr = _p(params, 'host') or sni or host
    if hdr: wo['headers'] = {'Host': hdr}
    n['ws-opts'] = wo

def _grpc(n, params):
    n['network'] = 'grpc'
    n['grpc-opts'] = {'grpc-service-name': _p(params, 'serviceName') or _p(params, 'path') or ''}

def _net_opts(n, net, params, host, sni):
    if net == 'ws': _ws(n, params, host, sni)
    elif net in ('grpc', 'gun'): _grpc(n, params)
    elif net in ('h2', 'http'):
        n['network'] = 'h2'
        o = {'path': _p(params, 'path', '/') or '/'}
        h = _p(params, 'host')
        if h: o['host'] = [h]
        n['h2-opts'] = o
    elif net in ('xhttp', 'splithttp'):
        n['network'] = net
        o = {'path': _p(params, 'path', '/') or '/'}
        h = _p(params, 'host') or sni
        if h: o['host'] = h
        m = _p(params, 'mode')
        if m: o['mode'] = m
        n[net + '-opts'] = o
    elif net not in ('tcp', ''):
        n['network'] = net

def _tls_common(n, params):
    sec = (_p(params, 'security') or 'none').lower()
    sni = _p(params, 'sni') or _p(params, 'peer') or _p(params, 'servername')
    if sec in ('tls', 'reality', 'xtls'): n['tls'] = True
    if not sni and sec == 'tls': sni = _p(params, 'host')
    if sni: n['servername'] = sni
    fp = _p(params, 'fp')
    if fp: n['client-fingerprint'] = fp
    alpn = _alpn(_p(params, 'alpn'))
    if alpn: n['alpn'] = alpn
    if sec == 'reality':
        ro = {'public-key': _p(params, 'pbk', '')}
        if _p(params, 'sid'): ro['short-id'] = _p(params, 'sid')
        if _p(params, 'spx'): ro['spider-x'] = _p(params, 'spx')
        n['reality-opts'] = ro
    if _p(params, 'allowInsecure') in ('1', 'true', 'yes'): n['skip-cert-verify'] = True
    return sni

# ---------- parsers ----------
def parse_vless(u):
    body, params, frag = _split_uri(u, 'vless')
    uuid_, _, hp = body.partition('@')
    host, port = _host_port(hp)
    n = {'type': 'vless', 'server': host, 'port': port, 'uuid': uuid_, 'udp': True}
    sni = _tls_common(n, params)
    flow = _p(params, 'flow')
    if flow: n['flow'] = flow
    _net_opts(n, (_p(params, 'type') or 'tcp').lower(), params, host, sni)
    return n, frag

def parse_vmess(u):
    d = json.loads(b64d(u[len('vmess://'):]))
    host = d.get('add') or d.get('server') or ''
    n = {'type': 'vmess', 'server': host, 'port': int(d.get('port') or 443),
         'uuid': d.get('id', ''), 'alterId': int(d.get('aid') or 0),
         'cipher': d.get('scy') or 'auto', 'udp': True}
    sni = d.get('sni') or ''
    if d.get('tls') == 'tls':
        n['tls'] = True
        sni = sni or d.get('host') or host
        n['servername'] = sni
        if d.get('fp'): n['client-fingerprint'] = d['fp']
        alpn = _alpn(d.get('alpn'))
        if alpn: n['alpn'] = alpn
    net = (d.get('net') or 'tcp').lower()
    params = {'path': [d.get('path', '/')], 'host': [d.get('host', '')], 'serviceName': [d.get('path', '')]}
    _net_opts(n, net, params, host, sni)
    return n, d.get('ps') or ''

def parse_trojan(u):
    body, params, frag = _split_uri(u, 'trojan')
    pw, _, hp = body.partition('@')
    host, port = _host_port(hp)
    n = {'type': 'trojan', 'server': host, 'port': port, 'password': urllib.parse.unquote(pw), 'udp': True}
    sec = (_p(params, 'security') or 'tls').lower()
    sni = _p(params, 'sni') or _p(params, 'peer') or host
    n['sni'] = sni
    fp = _p(params, 'fp')
    if fp: n['client-fingerprint'] = fp
    alpn = _alpn(_p(params, 'alpn'))
    if alpn: n['alpn'] = alpn
    if sec == 'reality':
        n['tls'] = True
        ro = {'public-key': _p(params, 'pbk', '')}
        if _p(params, 'sid'): ro['short-id'] = _p(params, 'sid')
        n['reality-opts'] = ro
    if _p(params, 'allowInsecure') in ('1', 'true'): n['skip-cert-verify'] = True
    _net_opts(n, (_p(params, 'type') or 'tcp').lower(), params, host, sni)
    return n, frag

def parse_ss(u):
    body, params, frag = _split_uri(u, 'ss')
    if '@' in body:
        info, _, hp = body.partition('@')
        try: info = b64d(info)
        except Exception: pass
    else:
        info = b64d(body)
        info, _, hp = info.rpartition('@')
    host, port = _host_port(hp)
    method, _, password = info.partition(':')
    return {'type': 'ss', 'server': host, 'port': port, 'cipher': method, 'password': password, 'udp': True}, frag

PARSERS = {'vless': parse_vless, 'vmess': parse_vmess, 'trojan': parse_trojan, 'ss': parse_ss}

# ---------- mini YAML emitter (без зависимостей) ----------
def _plain_ok(s: str) -> bool:
    if not s or s.lower() in RESERVED: return False
    if re.fullmatch(r'[+-]?(\d+|\d*\.\d+)([eE][+-]?\d+)?', s): return False
    if re.fullmatch(r'0x[0-9a-fA-F]+', s): return False
    if re.fullmatch(r'\d{4}-\d{1,2}-\d{1,2}([T ]\d{1,2}:\d{2}(:\d{2})?.*)?', s): return False
    if s[0] in "-?:,[]{}#&*!|>'\"%@` ": return False
    if '"' in s or ': ' in s or s.endswith(':') or ' #' in s: return False
    if any(c < ' ' for c in s): return False
    return True

def _scalar(v):
    if v is True:  return 'true'
    if v is False: return 'false'
    if v is None:  return 'null'
    if isinstance(v, int): return str(v)
    s = str(v)
    if _plain_ok(s): return s
    esc = s.replace('\\', '\\\\').replace('"', '\\"').replace('\n', '\\n').replace('\t', '\\t')
    return f'"{esc}"'

def emit_lines(val, ind):
    pad = '  ' * ind
    out = []
    if isinstance(val, dict):
        for k, v in val.items():
            if isinstance(v, (dict, list)) and v:
                out.append(f'{pad}{k}:')
                out += emit_lines(v, ind + 1)
            elif isinstance(v, (dict, list)):
                out.append(f'{pad}{k}: ' + ('[]' if isinstance(v, list) else '{}'))
            else:
                out.append(f'{pad}{k}: {_scalar(v)}')
    elif isinstance(val, list):
        for item in val:
            if isinstance(item, dict):
                sub = emit_lines(item, ind + 1)
                sub[0] = pad + '- ' + sub[0].strip()
                out += sub
            else:
                out.append(f'{pad}- {_scalar(item)}')
    return out

# ---------- document ----------
def build_doc(proxies):
    auto, manual = f'{PREFIX} Auto Select', f'{PREFIX} Manual'
    dns = {
        'enable': True, 'prefer-h3': False, 'ipv6': False,
        'use-hosts': True, 'use-system-hosts': True,
        'enhanced-mode': 'fake-ip', 'fake-ip-range': '198.18.0.1/16',
        'fake-ip-filter-mode': 'blacklist',
        'fake-ip-filter': ['.lan', '.local', 'localhost', 'time.*.com', 'time.*.gov',
                           'time.*.apple.com', 'time-ios.apple.com', '*.pool.ntp.org',
                           '+.push.apple.com', '+.stun.*.*', '+.stun.*.*.*',
                           'lens.l.google.com', '*.msftncsi.com', '*.msftconnecttest.com'],
        'cache-algorithm': 'arc',
        'default-nameserver': ['8.8.8.8', '8.8.4.4', '9.9.9.9', '1.1.1.1'],
        'nameserver': ['https://dns.google/dns-query', 'https://cloudflare-dns.com/dns-query',
                       'https://dns.quad9.net/dns-query', 'https://doh.opendns.com/dns-query',
                       'https://dns.adguard-dns.com/dns-query', 'https://dns.mullvad.net/dns-query'],
        'proxy-server-nameserver': ['8.8.8.8', '1.1.1.1', '9.9.9.9', 'system'],
    }
    sniffer = {'enable': True, 'force-dns-mapping': True, 'parse-pure-ip': True,
               'override-destination': False,
               'sniff': {'HTTP': {'ports': [80, '8080-8880'], 'override-destination': True},
                         'TLS':  {'ports': [443, 8443]},
                         'QUIC': {'ports': [443, 8443]}}}
    groups = [
        {'name': auto, 'type': 'url-test', 'include-all': True,
         'exclude-type': 'Direct|Reject|RejectDrop|Compatible|Pass|Dns',
         'url': 'https://www.gstatic.com/generate_204', 'interval': 300, 'tolerance': 150,
         'lazy': True, 'timeout': 5000, 'max-failed-times': 2, 'expected-status': 204},
        {'name': manual, 'type': 'select', 'proxies': [auto], 'include-all': True,
         'exclude-type': 'Direct|Reject|RejectDrop|Compatible|Pass|Dns', 'default-selected': auto},
        {'name': 'GLOBAL', 'type': 'select', 'proxies': [auto, manual], 'default-selected': auto},
    ]
    rules = ['DOMAIN-SUFFIX,localhost,DIRECT', 'DOMAIN-SUFFIX,local,DIRECT', 'DOMAIN-SUFFIX,lan,DIRECT',
             'IP-CIDR,127.0.0.0/8,DIRECT,no-resolve', 'IP-CIDR,10.0.0.0/8,DIRECT,no-resolve',
             'IP-CIDR,172.16.0.0/12,DIRECT,no-resolve', 'IP-CIDR,192.168.0.0/16,DIRECT,no-resolve',
             'IP-CIDR,169.254.0.0/16,DIRECT,no-resolve', 'IP-CIDR,100.64.0.0/10,DIRECT,no-resolve']
    if RU_DIRECT:
        rules += ['DOMAIN-SUFFIX,ru,DIRECT', 'DOMAIN-SUFFIX,xn--p1ai,DIRECT',
                  'GEOSITE,category-ru,DIRECT', 'GEOIP,RU,DIRECT']
    rules.append(f'MATCH,{manual}')
    return {'mode': 'rule', 'unified-delay': True, 'tcp-concurrent': True,
            'keep-alive-idle': 300, 'keep-alive-interval': 60,
            'profile': {'store-selected': True, 'store-fake-ip': True},
            'dns': dns, 'sniffer': sniffer,
            'proxies': proxies, 'proxy-groups': groups, 'rules': rules}

def main():
    if not os.path.exists(SRC):
        sys.exit(f'[!] {SRC} not found in repo root')
    raw = open(SRC, encoding='utf-8', errors='ignore').read()
    uris = expand_uris(collect_texts(raw))
    proxies, seen, skipped = [], set(), 0
    for i, u in enumerate(uris, 1):
        scheme = u.split(':', 1)[0].lower()
        try:
            n, frag = PARSERS[scheme](u)
        except Exception as e:
            skipped += 1; print(f'[warn] line {i}: skip ({e})'); continue
        key = json.dumps(n, sort_keys=True, ensure_ascii=False)
        if key in seen:
            skipped += 1; continue
        seen.add(key)
        name = re.sub(r'\s+', ' ', frag.strip()) or n['server']
        proxies.append({'name': f'{PREFIX} Node {len(proxies)+1:03d} | {name}', **n})
    if not proxies:
        sys.exit('[!] no proxies parsed from ' + SRC)
    now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
    header = ('\n'.join([
        '#' + '=' * 60,
        f'# {PREFIX} Mihomo Subscription',
        f'# Source: {SRC}',
        f'# Nodes: {len(proxies)} | Skipped/dupes: {skipped}',
        f'# Generated: {now} | convert_mifa.py (GitHub Actions)',
        f'# Mode: rule | Auto Select + Manual | RU-DIRECT: {RU_DIRECT}',
        '#' + '=' * 60, '']) + '\n')
    open(DST, 'w', encoding='utf-8').write(header + '\n'.join(emit_lines(build_doc(proxies), 0)) + '\n')
    kinds = {}
    for p in proxies: kinds[p['type']] = kinds.get(p['type'], 0) + 1
    print(f'[ok] {DST}: {len(proxies)} proxies {kinds}, skipped {skipped}')

if __name__ == '__main__':
    main()