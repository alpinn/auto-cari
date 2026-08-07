"""Normalize raw Serper Google Shopping results into our internal shape.

Responsibilities:
- Filter to allowed Indonesian marketplaces only.
- Parse messy price strings ("Rp 7.999.000", "Rp7999000", "7.999.000") to int IDR.
- Detect marketplace + store badge.
- Trim to relevant fields, cap result count.
"""

import hashlib
import re

ALLOWED_MARKETPLACES = ["tokopedia", "shopee", "lazada", "blibli"]

_DIGITS_RE = re.compile(r"\d+")


def format_price(price_int: int) -> str:
    """7999000 -> 'Rp 7.999.000'."""
    return f"Rp {price_int:,.0f}".replace(",", ".")


def parse_price(raw) -> int | None:
    """Parse a Serper price (str or number) into integer IDR.

    Handles 'Rp 7.999.000', 'Rp7.999.000', '7999000', 7999000, 7999000.0.
    Treats '.' and ',' as thousands separators (IDR has no decimal cents here).
    """
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return int(raw) if raw > 0 else None

    s = str(raw)
    digits = "".join(_DIGITS_RE.findall(s))
    if not digits:
        return None
    value = int(digits)
    return value if value > 0 else None


def detect_marketplace(url: str, source: str) -> str | None:
    haystack = f"{url or ''} {source or ''}".lower()
    for mp in ALLOWED_MARKETPLACES:
        if mp in haystack:
            return mp
    return None


def detect_store_badge(source: str, badge: str) -> str | None:
    source = (source or "").lower()
    badge = (badge or "").lower()
    if "official" in source or "official" in badge:
        return "official"
    if "mall" in source or "mall" in badge:
        return "official"
    if badge and "top" in badge:
        return "top_seller"
    return None


def _external_id(marketplace: str, url: str, title: str) -> str:
    base = f"{marketplace}|{url}|{title}".lower()
    return hashlib.md5(base.encode("utf-8")).hexdigest()


def normalize_serper_products(raw_products: list[dict], cap: int = 10) -> list[dict]:
    """Map raw Serper shopping items -> normalized dicts ready for the LLM/DB.

    Only keeps items from allowed marketplaces with a parseable price and URL.
    """
    normalized: list[dict] = []
    for item in raw_products or []:
        url = item.get("link") or item.get("url") or ""
        source = item.get("source") or item.get("store") or ""
        marketplace = detect_marketplace(url, source)
        if not marketplace:
            continue

        price = parse_price(item.get("price"))
        if price is None or not url:
            continue

        rating = item.get("rating")
        try:
            rating = round(float(rating), 2) if rating is not None else None
        except (TypeError, ValueError):
            rating = None

        title = (item.get("title") or "").strip()
        if not title:
            continue

        image_url = item.get("imageUrl") or item.get("thumbnailUrl")
        if image_url and image_url.startswith("data:"):
            image_url = None

        normalized.append(
            {
                "external_id": _external_id(marketplace, url, title),
                "name": title,
                "marketplace": marketplace,
                "store_name": source or None,
                "store_badge": detect_store_badge(source, item.get("badge", "")),
                "price": price,
                "price_formatted": format_price(price),
                "rating": rating,
                "image_url": image_url,
                "product_url": url,
            }
        )
        if len(normalized) >= cap:
            break

    return normalized
