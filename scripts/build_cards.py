#!/usr/bin/env python3
"""Reproducible builder for SecretaryBird per-language hub card files (data/cards/{hub}.{lang}.json)."""

import gzip
import hashlib
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = REPO_ROOT / "data" / "cards"

HUBS = ("hospitals", "doctors", "costs")

SHORT_LOCALIZED_FIELDS = frozenset({
    "title",
    "facility_name",
    "city_name",
    "country_name",
    "locationLabel",
    "doctor_name",
    "primary_facility_name",
    "lead_doctor_name",
    "procedure_name",
    "primary_specialty",
    "specialty_category",
})


def is_localized_dict(obj, locale_set):
    return isinstance(obj, dict) and bool(obj) and set(obj.keys()).issubset(locale_set)


def pick_lang_val(loc_dict, lang):
    val = loc_dict.get(lang)
    if val is not None and val != "":
        return val
    en_val = loc_dict.get("en")
    return en_val if en_val is not None else ""


def transform_value(val, field_name, lang, locale_set):
    if is_localized_dict(val, locale_set):
        en_val = val.get("en") if val.get("en") is not None else ""
        chosen = pick_lang_val(val, lang)
        if field_name in SHORT_LOCALIZED_FIELDS:
            if lang == "en" or chosen == en_val:
                return {"en": en_val}
            return {lang: chosen, "en": en_val}
        return chosen
    if isinstance(val, dict):
        out = {}
        for k, v in val.items():
            out[k] = transform_value(v, k, lang, locale_set)
        return out
    if isinstance(val, list):
        return [transform_value(item, field_name, lang, locale_set) for item in val]
    return val


def transform_record(rec, lang, locale_set):
    out = {}
    for k, v in rec.items():
        if k == "image_provenance":
            continue
        if k == "seo":
            if isinstance(v, dict) and "image_alt" in v:
                out["seo"] = {
                    "image_alt": transform_value(v["image_alt"], "image_alt", lang, locale_set)
                }
            continue
        out[k] = transform_value(v, k, lang, locale_set)
    return out


def build_all_cards():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    hosp_raw = json.loads((REPO_ROOT / "hospitals.json").read_text(encoding="utf-8"))
    locales = sorted(hosp_raw["locales"])
    locale_set = frozenset(locales)

    manifest = []
    for hub in HUBS:
        src_data = json.loads((REPO_ROOT / f"{hub}.json").read_text(encoding="utf-8"))
        items = src_data["items"]
        for lang in locales:
            cards = [transform_record(r, lang, locale_set) for r in items]
            payload_str = json.dumps(cards, ensure_ascii=False, separators=(",", ":")) + "\n"
            payload_bytes = payload_str.replace("\r\n", "\n").encode("utf-8")
            out_path = OUT_DIR / f"{hub}.{lang}.json"
            out_path.write_bytes(payload_bytes)
            gz_bytes = gzip.compress(payload_bytes, compresslevel=9, mtime=0)
            manifest.append({
                "file": f"data/cards/{hub}.{lang}.json",
                "hub": hub,
                "lang": lang,
                "raw_bytes": len(payload_bytes),
                "gzip_bytes": len(gz_bytes),
                "sha256": hashlib.sha256(payload_bytes).hexdigest(),
            })
    return manifest


if __name__ == "__main__":
    results = build_all_cards()
    for r in results:
        if r["hub"] == "hospitals":
            assert r["raw_bytes"] <= 1_000 * 1024, f"Size gate exceeded for {r['file']}: {r['raw_bytes']} bytes"
    print(f"Built {len(results)} card files in {OUT_DIR}")
    for r in results:
        if r["lang"] in ("en", "ar", "ru"):
            print(f"  {r['file']:32} | raw={r['raw_bytes']:>7,} B ({r['raw_bytes']/1024:6.1f} KB) | gz={r['gzip_bytes']:>6,} B | sha256={r['sha256'][:16]}...")
