"""Normalize raw Serper Google Shopping results into our internal shape.

Responsibilities:
- Filter to allowed Indonesian marketplaces only.
- Parse messy price strings ("Rp 7.999.000", "Rp7999000", "7.999.000") to int IDR.
- Detect marketplace + store badge.
- Trim to relevant fields, cap result count.
"""

import hashlib
import re

from app.utils.url_generator import generate_product_link

ALLOWED_MARKETPLACES = ["tokopedia", "shopee", "lazada", "blibli"]

_DIGITS_RE = re.compile(r"\d+")
_BUDGET_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*(juta|jt|ribu|rb)\b", re.IGNORECASE)


def extract_budget_max(query: str) -> int | None:
    """Parse the highest budget figure mentioned in an Indonesian query.

    Handles "20 juta", "20jt", "budget 20 juta", "500rb", etc. Takes the last
    match since the budget is usually stated at the end of the sentence.
    """
    matches = list(_BUDGET_RE.finditer(query or ""))
    if not matches:
        return None
    value_str, unit = matches[-1].groups()
    value = float(value_str.replace(",", "."))
    multiplier = 1_000_000 if unit.lower() in ("juta", "jt") else 1_000
    return int(value * multiplier)


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


def normalize_serper_products(
    raw_products: list[dict], cap: int = 10, budget_max: int | None = None
) -> list[dict]:
    """Map raw Serper shopping items -> normalized dicts ready for the LLM/DB.

    Only keeps items from allowed marketplaces with a parseable price and URL.
    Serper's own ordering is relevance-ranked, not price-ranked, and skews toward
    mass-market listings — so when budget_max is known, sort candidates closest
    to (at or under) the budget ceiling first, before applying cap. Otherwise a
    fixed cap silently drops higher-priced options that never happened to rank
    early in Serper's raw order.
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
                "product_url": generate_product_link(marketplace, title),
            }
        )

    if budget_max is not None:
        def _distance(p: dict) -> tuple[int, int]:
            price = p["price"]
            if price <= budget_max:
                return (0, budget_max - price)
            return (1, price - budget_max)

        normalized.sort(key=_distance)

    return normalized[:cap]


_TOKEN_RE = re.compile(r"[a-z0-9]+")
_ACCESSORY_RE = re.compile(
    r"\b(case|casing|softcase|cover|baterai|battery|charger|kabel|cable|tempered|"
    r"anti ?gores|protector|lcd|sparepart|spare ?part|dummy|holder|stand|sleeve|skin|"
    r"adesive|sticker|second|seken|bekas|refurbish\w*)\b",
    re.IGNORECASE,
)


# Suffixes that make a *different* SKU ("S24" != "S24 FE", "X90 Pro" != "X90 Pro Plus").
_VARIANT_TOKENS = {"fe", "plus", "max", "ultra", "pro", "mini", "lite", "se", "air", "neo"}


def _has_phrase(tokens: list[str], phrase: list[str]) -> bool:
    n = len(phrase)
    for i in range(len(tokens) - n + 1):
        if tokens[i : i + n] != phrase:
            continue
        nxt = tokens[i + n] if i + n < len(tokens) else None
        if nxt in _VARIANT_TOKENS and nxt not in phrase:
            continue
        return True
    return False


def pick_candidate_listing(
    candidate: str, normalized: list[dict], budget_max: int | None = None
) -> dict | None:
    """Best real listing for one LLM-proposed product name, or None to drop it.

    Keeps listings whose title contains the candidate name as a contiguous phrase
    ("Xiaomi 13 Pro" must not match "Xiaomi Note 13 Pro"), isn't an accessory/spare
    part, and is within budget; discards price outliers (< half the median of the
    matches, or < 30% of budget), then takes the cheapest survivor. No survivor = not sold in ID / over budget -> None.
    """
    tokens = _TOKEN_RE.findall(candidate.lower())
    if not tokens:
        return None
    matches = [
        p for p in normalized
        if _has_phrase(_TOKEN_RE.findall(p["name"].lower()), tokens)
        and not _ACCESSORY_RE.search(p["name"])
    ]
    if not matches:
        return None
    prices = sorted(p["price"] for p in matches)
    # ponytail: median floor is a heuristic, swap for category-aware price bands if accessories leak through
    floor = prices[len(prices) // 2] * 0.5
    if budget_max:
        floor = max(floor, budget_max * 0.3)  # a 45rb "Pixel 8 Pro" isn't a phone, whatever the median says
    ok = [p for p in matches if p["price"] >= floor and (budget_max is None or p["price"] <= budget_max)]
    return min(ok, key=lambda p: p["price"]) if ok else None


def _demo() -> None:
    items = [
        {"name": "Case iPhone 16 Pro Clear", "price": 80_000},
        {"name": "Apple iPhone 16 Pro 128GB", "price": 17_500_000},
        {"name": "Apple iPhone 16 Pro 256GB", "price": 19_000_000},
        {"name": "Apple iPhone 16 Pro Max", "price": 24_000_000},
    ]
    assert pick_candidate_listing("iPhone 16 Pro", items, 20_000_000)["price"] == 17_500_000
    assert pick_candidate_listing("iPhone 16 Pro", items, 10_000_000) is None
    assert pick_candidate_listing("Galaxy S24 Ultra", items, None) is None
    assert pick_candidate_listing("Galaxy S24", [{"name": "Galaxy S24 FE 5G", "price": 9_000_000}], None) is None
    assert pick_candidate_listing("iPhone 15", [{"name": "iPhone 15 SECOND", "price": 9_000_000}], None) is None
    assert pick_candidate_listing("Pixel 8 Pro", [{"name": "Pixel 8 Pro", "price": 45_000}], 20_000_000) is None
    note = [{"name": "Xiaomi Note 13 Pro 5G", "price": 2_750_000}]
    assert pick_candidate_listing("Xiaomi 13 Pro", note, None) is None
    batt = [{"name": "BATERAI GOOGLE PIXEL 8 PRO", "price": 215_000}]
    assert pick_candidate_listing("Google Pixel 8 Pro", batt, None) is None

    assert extract_budget_max("smartphone untuk video dengan budget 20 juta") == 20_000_000
    assert extract_budget_max("hp dibawah 1.5jt") == 1_500_000
    assert extract_budget_max("earphone 500rb") == 500_000
    assert extract_budget_max("laptop gaming") is None

    raw = [
        {"link": "https://shopee.co.id/a", "price": "Rp 3.000.000", "title": "Cheap phone"},
        {"link": "https://shopee.co.id/b", "price": "Rp 19.500.000", "title": "Near-budget phone"},
        {"link": "https://shopee.co.id/c", "price": "Rp 25.000.000", "title": "Over-budget phone"},
    ]
    result = normalize_serper_products(raw, cap=2, budget_max=20_000_000)
    assert [p["name"] for p in result] == ["Near-budget phone", "Cheap phone"], result

    print("normalizer._demo OK")


if __name__ == "__main__":
    _demo()
