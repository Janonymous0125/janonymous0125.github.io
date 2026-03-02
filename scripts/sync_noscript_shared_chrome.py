#!/usr/bin/env python3
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / 'shared-chrome-config.js'
PAGES = [
    ROOT / 'index.html',
    ROOT / 'about.html',
    ROOT / 'contact.html',
    ROOT / 'CyberSec.html',
    ROOT / 'GameDev.html',
    ROOT / 'MusicP.html',
    ROOT / 'VideoEditing.html',
    ROOT / 'blog.html',
    ROOT / 'automation-case-study.html',
    ROOT / 'bandit-case-study.html',
    ROOT / 'nightfall-kingdoms-case-study.html',
    ROOT / 'certifications-proof.html',
    ROOT / 'notes-learning-hub.html',
]

HEADER_MOUNT_RE = re.compile(r'(?P<indent>^[ \t]*)<div data-shared-header(?P<attrs>[^>]*)></div>\s*<noscript>.*?</noscript>', re.DOTALL | re.MULTILINE)
FOOTER_MOUNT_RE = re.compile(r'(?P<indent>^[ \t]*)<div data-shared-footer></div>\s*<noscript>.*?</noscript>', re.DOTALL | re.MULTILINE)
CONFIG_RE = re.compile(r'window\.sharedChromeConfig\s*=\s*(\{.*\})\s*;', re.DOTALL)


def load_config() -> dict:
    raw = CONFIG_PATH.read_text(encoding='utf-8')
    match = CONFIG_RE.search(raw)
    if not match:
        raise RuntimeError(f'Could not parse shared chrome config from {CONFIG_PATH.name}')
    return json.loads(match.group(1))


CONFIG = load_config()
HEADER_CONFIG = CONFIG.get('header', {})
FOOTER_CONFIG = CONFIG.get('footer', {})
HEADER_PAGES = HEADER_CONFIG.get('pages', {})
BLOG_KEYS = set(HEADER_CONFIG.get('blogNav', []))
BLOG_BUTTON_LABEL = HEADER_CONFIG.get('blogButtonLabel', 'Blog ▾')


def escape_attr(value: str) -> str:
    return html.escape(value, quote=True)


def escape_text(value: str) -> str:
    return html.escape(value)


def format_attrs(item: dict) -> str:
    parts = [f'href="{escape_attr(item["href"])}"']
    if item.get('download'):
        parts.append('download')
    if item.get('target'):
        parts.append(f'target="{escape_attr(item["target"])}"')
    if item.get('rel'):
        parts.append(f'rel="{escape_attr(item["rel"])}"')
    return ' '.join(parts)


def nav_link(indent: str, href: str, label: str, is_current: bool) -> str:
    current_attr = ' aria-current="page"' if is_current else ''
    return f'{indent}<a href="{escape_attr(href)}"{current_attr}>{escape_text(label)}</a>'


def build_header_noscript(page_key: str, page_title: str, indent: str) -> str:
    lines = [
        f'{indent}<noscript>',
        f'{indent}  <header>',
        f'{indent}    <h1>{escape_text(page_title)}</h1>',
        f'{indent}    <nav>',
    ]

    primary_keys = [key for key in HEADER_CONFIG.get('primaryNav', []) if key != 'contact']
    for key in primary_keys:
        page = HEADER_PAGES.get(key)
        if not page:
            continue
        lines.append(nav_link(f'{indent}      ', page['href'], page['label'], page_key == key))

    dropdown_class = 'dropdown open-current' if page_key in BLOG_KEYS else 'dropdown'
    button_current = ' aria-current="page"' if page_key in BLOG_KEYS else ''
    lines.extend([
        f'{indent}      <div class="{dropdown_class}">',
        f'{indent}        <button class="dropdown-toggle" aria-haspopup="true" aria-expanded="false"{button_current}>{escape_text(BLOG_BUTTON_LABEL)}</button>',
        f'{indent}        <div class="dropdown-content">',
    ])
    for key in HEADER_CONFIG.get('blogNav', []):
        page = HEADER_PAGES.get(key)
        if not page:
            continue
        lines.append(nav_link(f'{indent}          ', page['href'], page['label'], page_key == key))
    contact_page = HEADER_PAGES.get('contact', {'href': 'contact.html', 'label': 'Contact'})
    lines.extend([
        f'{indent}        </div>',
        f'{indent}      </div>',
        nav_link(f'{indent}      ', contact_page['href'], contact_page['label'], page_key == 'contact'),
        f'{indent}      <button id="darkModeToggle" aria-label="Toggle dark mode" aria-pressed="false" disabled>🌓</button>',
        f'{indent}    </nav>',
        f'{indent}  </header>',
        f'{indent}</noscript>',
    ])
    return '\n'.join(lines)


def build_footer_noscript(indent: str) -> str:
    lines = [
        f'{indent}<noscript>',
        f'{indent}  <footer class="footer">',
        f'{indent}    <div class="footer-trust-links">',
    ]
    for item in FOOTER_CONFIG.get('trustLinks', []):
        lines.append(f'{indent}      <a {format_attrs(item)}>{escape_text(item["label"])}</a>')
    lines.extend([
        f'{indent}    </div>',
        f'{indent}    <div class="social-icons">',
    ])
    for item in FOOTER_CONFIG.get('socialLinks', []):
        lines.extend([
            f'{indent}      <a {format_attrs(item)} aria-label="{escape_attr(item["label"])}">',
            f'{indent}        <img src="{escape_attr(item["icon"])}" alt="{escape_attr(item["label"])}" />',
            f'{indent}      </a>',
        ])
    lines.extend([
        f'{indent}    </div>',
        f'{indent}    <p class="footer-copy">{escape_text(FOOTER_CONFIG.get("copy", ""))}</p>',
        f'{indent}  </footer>',
        f'{indent}</noscript>',
    ])
    return '\n'.join(lines)


def replace_header(match: re.Match[str]) -> str:
    indent = match.group('indent')
    attrs = match.group('attrs')
    page_key_match = re.search(r'data-page-key="([^"]+)"', attrs)
    page_title_match = re.search(r'data-page-title="([^"]*)"', attrs)
    page_key = page_key_match.group(1) if page_key_match else 'home'
    page_title = page_title_match.group(1) if page_title_match else HEADER_PAGES.get('home', {}).get('h1', 'Jeremiah Wong Zhi Qi')
    mount = f'{indent}<div data-shared-header{attrs}></div>'
    return f'{mount}\n{build_header_noscript(page_key, page_title, indent)}'


def replace_footer(match: re.Match[str]) -> str:
    indent = match.group('indent')
    mount = f'{indent}<div data-shared-footer></div>'
    return f'{mount}\n{build_footer_noscript(indent)}'


def sync_page(path: Path) -> None:
    original = path.read_text(encoding='utf-8')
    header_match = HEADER_MOUNT_RE.search(original)
    footer_match = FOOTER_MOUNT_RE.search(original)

    if not header_match or not footer_match:
        raise RuntimeError(f'Missing shared chrome mount + noscript pair in {path.name}')

    updated = HEADER_MOUNT_RE.sub(replace_header, original, count=1)
    updated = FOOTER_MOUNT_RE.sub(replace_footer, updated, count=1)
    path.write_text(updated, encoding='utf-8')


if __name__ == '__main__':
    for page in PAGES:
        sync_page(page)
    print(f'Synced noscript shared chrome for {len(PAGES)} pages using {CONFIG_PATH.name}.')
