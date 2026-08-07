"""GET /api/categories and GET /api/categories/{id}.

The category catalog is static (Phase 1). A category detail page reuses the
search pipeline to populate live products and adds a Market Intelligence
summary (LLM-light placeholder, cached).
"""

import asyncio
import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.config import settings
from app.models.response import (
    CategoriesResponse,
    Category,
    CategoryDetailResponse,
    MarketIntelligence,
    Subcategory,
)
from app.services.cache_service import cache_service
from app.services.serper_service import serper_service
from app.utils.normalizer import normalize_serper_products

logger = logging.getLogger("autocari.categories")
router = APIRouter()

# Static Phase-1 catalog.
ELECTRONICS = Category(
    id="electronics",
    label="Elektronik & Gadgets",
    available=True,
    subcategories=[
        Subcategory(id="smartphones", label="Smartphones & Tablets"),
        Subcategory(id="laptops", label="Laptops & Computing"),
        Subcategory(id="audio", label="Audio & Accessories"),
        Subcategory(id="cameras", label="Kamera & Aksesoris"),
        Subcategory(id="gaming", label="Gaming & Konsol"),
        Subcategory(id="peripherals", label="Peripheral & Aksesori"),
    ],
)

COMING_SOON = [
    Category(id="home_living", label="Home & Living", available=False, coming_soon=True),
    Category(id="fashion", label="Fashion & Style", available=False, coming_soon=True),
    Category(id="finance", label="Investasi & Saham", available=False, coming_soon=True),
    Category(id="health", label="Obat & Suplemen", available=False, coming_soon=True),
    Category(id="travel", label="Travel & Hotel", available=False, coming_soon=True),
    Category(id="education", label="Kursus Online", available=False, coming_soon=True),
]

# Search keyword per available (sub)category id, used for the detail page.
CATEGORY_SEARCH = {
    # "elektronik" alone invites home-appliance matches (fans, washing machines) on
    # Google Shopping; "gadget teknologi" reliably stays within phones/wearables/audio/etc.
    "electronics": "gadget teknologi terbaik",
    "smartphones": "smartphone terbaik Indonesia",
    "laptops": "laptop terbaik Indonesia",
    "audio": "earphone headphone TWS terbaik",
    "cameras": "kamera mirrorless terbaik",
    "gaming": "konsol gaming terbaik",
    "peripherals": "keyboard mouse gaming terbaik",
}

SUBCATEGORY_LABELS = {sc.id: sc.label for sc in ELECTRONICS.subcategories}
SUBCATEGORY_LABELS["electronics"] = ELECTRONICS.label


@router.get("/categories", response_model=CategoriesResponse, summary="Daftar semua kategori")
async def list_categories() -> CategoriesResponse:
    return CategoriesResponse(categories=[ELECTRONICS, *COMING_SOON])


@router.get("/categories/{category_id}", summary="Detail kategori + produk")
async def category_detail(category_id: str):
    # Reject unknown / coming-soon categories.
    if category_id not in CATEGORY_SEARCH:
        coming = next((c for c in COMING_SOON if c.id == category_id), None)
        if coming:
            return JSONResponse(
                status_code=200,
                content={
                    "type": "coming_soon",
                    "detected_category": coming.id,
                    "message": f"Kategori {coming.label} sedang kami siapkan!",
                },
            )
        return JSONResponse(
            status_code=404,
            content={"type": "error", "code": "CATEGORY_NOT_FOUND", "message": "Kategori tidak ditemukan."},
        )

    cache_key = f"category:{category_id}"
    cached = await cache_service.get_json(cache_key)
    if cached:
        return JSONResponse(content=cached)

    label = SUBCATEGORY_LABELS.get(category_id, category_id.title())
    products = []
    try:
        raw = await serper_service.search_shopping(CATEGORY_SEARCH[category_id], num=12)
        normalized = normalize_serper_products(raw, cap=12)
        products = [
            {
                "id": p["external_id"],
                "name": p["name"],
                "image_url": p.get("image_url"),
                "price": p["price"],
                "price_formatted": p["price_formatted"],
                "marketplace": p["marketplace"],
                "store_name": p.get("store_name"),
                "store_badge": p.get("store_badge"),
                "rating": p.get("rating"),
                "score": 0.0,
                "pros": [],
                "cons": [],
                "ai_reasoning": "",
                "product_url": p["product_url"],
                "is_editor_choice": False,
            }
            for p in normalized
        ]
    except Exception as exc:
        logger.warning("category product fetch failed: %s", exc)

    for p in products:
        asyncio.create_task(
            cache_service.set_json(f"product:{p['id']}", p, ttl=settings.PRODUCT_CACHE_TTL)
        )

    detail = CategoryDetailResponse(
        id=category_id,
        label=label,
        match_count=len(products),
        location="Jakarta, ID",
        market_intelligence=MarketIntelligence(
            summary=f"Pasar {label} sedang aktif dengan banyak pilihan baru bermunculan.",
            trends=[f"Sedang naik daun: {label} terbaru"],
            price_alerts=["Info harga: pantau diskon flash sale mingguan"],
        ),
        products=[],  # filled below with raw dicts to match search card shape
    )
    payload = detail.model_dump()
    payload["products"] = products
    await cache_service.set_json(cache_key, payload, ttl=settings.CATEGORY_CACHE_TTL)
    return JSONResponse(content=payload)
