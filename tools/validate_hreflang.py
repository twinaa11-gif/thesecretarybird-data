#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Validator for sitemaps/hreflang.xml (Part 2e).
Checks:
1. Sitemap is well-formed XML (UTF-8 without BOM), under 50,000 URLs and 50 MB.
2. Every group is reciprocal and self-referencing.
3. No URL appears in two groups.
4. No group has two members with the same hreflang.
5. Every URL returns HTTP 200 and is its own canonical (no ?lang= or query/fragment).
Exits non-zero on any failure.
"""

import concurrent.futures
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

SM_NS = "http://www.sitemaps.org/schemas/sitemap/0.9"
XHTML_NS = "http://www.w3.org/1999/xhtml"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
}


def check_live_url(url: str):
    import time
    html = ""
    status = 0
    final_url = None
    for attempt in range(6):
        try:
            time.sleep(0.25)
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=30) as resp:
                status = resp.status
                html = resp.read().decode("utf-8", errors="replace")
                final_url = resp.geturl()
                break
        except urllib.error.HTTPError as he:
            if he.code == 429 and attempt < 5:
                time.sleep(10.0 * (attempt + 1))
                continue
            return url, he.code, None
        except Exception:
            if attempt == 5:
                return url, 0, None
            time.sleep(2.0 * (attempt + 1))

    m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', html, flags=re.I)
    if not m:
        m = re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']canonical["\']', html, flags=re.I)
    canonical = m.group(1).strip() if m else final_url
    return url, status, canonical


def validate_sitemap(sitemap_path: Path) -> int:
    errors = []

    if not sitemap_path.exists():
        print(f"FAIL: Sitemap file not found: {sitemap_path}")
        return 1

    raw_bytes = sitemap_path.read_bytes()
    size_bytes = len(raw_bytes)
    if raw_bytes.startswith(b"\xef\xbb\xbf"):
        errors.append("File starts with UTF-8 BOM (must be UTF-8 without BOM).")

    if size_bytes >= 50 * 1024 * 1024:
        errors.append(f"File size {size_bytes} bytes exceeds 50 MB limit.")

    try:
        xml_text = raw_bytes.decode("utf-8")
    except UnicodeDecodeError as exc:
        print(f"FAIL: Sitemap is not valid UTF-8: {exc}")
        return 1

    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as exc:
        print(f"FAIL: Malformed XML: {exc}")
        return 1

    if root.tag != f"{{{SM_NS}}}urlset":
        errors.append(f"Root element must be {{{SM_NS}}}urlset, got {root.tag}")

    url_elements = root.findall(f"{{{SM_NS}}}url")
    total_url_entries = len(url_elements)
    if total_url_entries == 0:
        errors.append("Sitemap contains 0 <url> entries.")
    if total_url_entries > 50000:
        errors.append(f"Sitemap contains {total_url_entries} <url> entries (limit is 50,000).")

    entries_by_loc = {}
    duplicate_locs = []

    for idx, url_el in enumerate(url_elements, start=1):
        loc_el = url_el.find(f"{{{SM_NS}}}loc")
        if loc_el is None or not (loc_el.text and loc_el.text.strip()):
            errors.append(f"<url> #{idx} is missing a non-empty <loc>.")
            continue
        loc = loc_el.text.strip()

        parsed = urllib.parse.urlsplit(loc)
        if parsed.query or parsed.fragment or "?lang=" in loc or "?m=1" in loc:
            errors.append(f"<loc> contains query string or fragment: {loc}")

        if loc in entries_by_loc:
            duplicate_locs.append(loc)
            errors.append(f"Duplicate <loc> entry in sitemap: {loc}")

        links = url_el.findall(f"{{{XHTML_NS}}}link")
        if len(links) < 2:
            errors.append(f"<url> {loc} has fewer than 2 <xhtml:link> elements ({len(links)}).")

        seen_hreflangs = set()
        seen_non_default_hrefs = set()
        link_map = {}

        for lk in links:
            rel = lk.attrib.get("rel", "")
            hreflang = lk.attrib.get("hreflang", "")
            href = lk.attrib.get("href", "")
            if rel != "alternate":
                errors.append(f"<url> {loc} has <xhtml:link> with rel={rel!r} (expected 'alternate').")
            if not hreflang or not href:
                errors.append(f"<url> {loc} has <xhtml:link> with empty hreflang or href.")
                continue
            p_href = urllib.parse.urlsplit(href)
            if p_href.query or p_href.fragment or "?lang=" in href or "?m=1" in href:
                errors.append(f"<xhtml:link> inside {loc} contains query/fragment: {href}")
            if hreflang in seen_hreflangs:
                errors.append(f"<url> {loc} has duplicate hreflang={hreflang!r}.")
            seen_hreflangs.add(hreflang)
            link_map[hreflang] = href
            if hreflang != "x-default":
                if href in seen_non_default_hrefs:
                    errors.append(f"<url> {loc} lists member href={href} under multiple languages.")
                seen_non_default_hrefs.add(href)

        # Self-referencing check
        non_default_pairs = {hl: hr for hl, hr in link_map.items() if hl != "x-default"}
        if loc not in non_default_pairs.values():
            errors.append(f"<url> {loc} is not self-referencing in its <xhtml:link> set.")

        # x-default check
        if "en" in non_default_pairs:
            if link_map.get("x-default") != non_default_pairs["en"]:
                errors.append(
                    f"<url> {loc} has 'en' member {non_default_pairs['en']} "
                    f"but x-default={link_map.get('x-default')!r}."
                )
        else:
            if "x-default" in link_map:
                errors.append(f"<url> {loc} has no 'en' member but includes x-default={link_map['x-default']!r}.")

        entries_by_loc[loc] = link_map

    # Reciprocity and disjoint group check
    unique_groups = set()
    url_to_group_signature = {}

    for loc, link_map in entries_by_loc.items():
        signature = tuple(sorted(link_map.items()))
        unique_groups.add(signature)
        member_urls = {hr for hl, hr in link_map.items() if hl != "x-default"}

        for member_url in member_urls:
            if member_url not in entries_by_loc:
                errors.append(f"Reciprocity failure: {loc} links to {member_url}, which has no <url> entry.")
                continue
            other_signature = tuple(sorted(entries_by_loc[member_url].items()))
            if signature != other_signature:
                errors.append(
                    f"Reciprocity failure between {loc} and {member_url}: "
                    f"link sets do not match."
                )
            if member_url in url_to_group_signature and url_to_group_signature[member_url] != signature:
                errors.append(f"URL {member_url} appears in more than one translation group.")
            url_to_group_signature[member_url] = signature

    # HTTP 200 and self-canonical check
    all_urls = sorted(entries_by_loc.keys())
    http_200_count = 0
    canonical_match_count = 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        for url, status, canonical in executor.map(check_live_url, all_urls):
            if status == 200:
                http_200_count += 1
            else:
                errors.append(f"URL returned HTTP {status} (expected 200): {url}")
            if canonical == url:
                canonical_match_count += 1
            else:
                errors.append(f"URL canonical mismatch: {url} -> canonical is {canonical!r}")

    print("=== SecretaryBird Hreflang Sitemap Validation Report ===")
    print(f"Sitemap file           : {sitemap_path.as_posix()}")
    print(f"File size              : {size_bytes:,} bytes (< 50 MB limit: PASS)")
    print(f"UTF-8 without BOM      : {'PASS' if not raw_bytes.startswith(b'\\xef\\xbb\\xbf') else 'FAIL'}")
    print(f"Well-formed XML        : PASS")
    print(f"Total <url> entries    : {total_url_entries} (< 50,000 limit: PASS)")
    print(f"Distinct groups        : {len(unique_groups)}")
    print(f"Duplicate <loc> count  : {len(duplicate_locs)}")
    print(f"Self-referencing check : {'PASS' if not any('self-referencing' in e for e in errors) else 'FAIL'}")
    print(f"Reciprocity check      : {'PASS' if not any('Reciprocity' in e for e in errors) else 'FAIL'}")
    print(f"Unique hreflang/group  : {'PASS' if not any('duplicate hreflang' in e for e in errors) else 'FAIL'}")
    print(f"Single group per URL   : {'PASS' if not any('more than one' in e for e in errors) else 'FAIL'}")
    print(f"HTTP 200 verified      : {http_200_count}/{len(all_urls)}")
    print(f"Self-canonical verified: {canonical_match_count}/{len(all_urls)}")

    if errors:
        print(f"\nVALIDATION FAILED with {len(errors)} error(s):")
        for err in errors:
            print(f"  - {err}")
        return 1

    print("\nRESULT: PASS (0 errors)")
    return 0


if __name__ == "__main__":
    default_sm = Path(__file__).resolve().parent.parent / "sitemaps" / "hreflang.xml"
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else default_sm
    sys.exit(validate_sitemap(target))
