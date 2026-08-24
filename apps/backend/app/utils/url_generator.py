"""Builds outbound product links.

Serper's Shopping API never returns a real merchant URL — its `link` field is
always Google's own catalog redirect (`google.com/search?ibp=oshop&...`),
confirmed empirically across locales/queries, and that page 404s once Google's
catalog entry goes stale. We only know `marketplace` + `title`, not a real
listing ID, so the best we can do is send the user to a search on the actual
e-commerce site instead of Google's page.

Kept as a single function so an affiliate tag can be appended later (per the
brainstorming doc's plan) without touching call sites.
"""

from urllib.parse import quote_plus

_SEARCH_URL_TEMPLATES = {
    "shopee": "https://shopee.co.id/search?keyword={q}",
    "tokopedia": "https://www.tokopedia.com/search?st=product&q={q}",
    "lazada": "https://www.lazada.co.id/catalog/?q={q}",
    "blibli": "https://www.blibli.com/cari/{q}",
}


def generate_product_link(marketplace: str, title: str) -> str:
    """Return a search-results URL for `title` on `marketplace`."""
    template = _SEARCH_URL_TEMPLATES.get(marketplace)
    if not template:
        return ""
    return template.format(q=quote_plus(title))


def _demo() -> None:
    assert generate_product_link("shopee", "OPPO Reno14 Pro 5G") == (
        "https://shopee.co.id/search?keyword=OPPO+Reno14+Pro+5G"
    )
    assert generate_product_link("unknown", "x") == ""
    print("url_generator._demo OK")


if __name__ == "__main__":
    _demo()
