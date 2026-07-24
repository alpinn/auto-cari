"""Pydantic response models — these define the public API contract.

Search returns a discriminated union on the `type` field so the frontend can
switch on a single key: success | clarifying | coming_soon | error.
"""

from typing import Literal

from pydantic import BaseModel, Field

# --------------------------------------------------------------------------- #
# Shared / product models
# --------------------------------------------------------------------------- #


class ProductCard(BaseModel):
    """A single ranked product as rendered in recommendation cards."""

    id: str
    name: str
    image_url: str | None = None
    price: int
    price_formatted: str
    marketplace: str
    store_name: str | None = None
    store_badge: str | None = None  # "official" | "top_seller" | None
    rating: float | None = None
    score: float = 0.0
    pros: list[str] = Field(default_factory=list)
    cons: list[str] = Field(default_factory=list)
    ai_reasoning: str = ""
    product_url: str
    is_editor_choice: bool = False


class ClarifyingOption(BaseModel):
    id: str
    label: str
    description: str
    icon: str


# --------------------------------------------------------------------------- #
# POST /api/search response variants
# --------------------------------------------------------------------------- #


class SearchSuccessResponse(BaseModel):
    type: Literal["success"] = "success"
    summary: str
    products: list[ProductCard]
    sources: list[str] = Field(default_factory=list)
    cached: bool = False
    query_id: str | None = None


class SearchClarifyingResponse(BaseModel):
    type: Literal["clarifying"] = "clarifying"
    context: str
    question: str
    options: list[ClarifyingOption]


class SearchComingSoonResponse(BaseModel):
    type: Literal["coming_soon"] = "coming_soon"
    detected_category: str
    message: str


class SearchErrorResponse(BaseModel):
    type: Literal["error"] = "error"
    code: str
    message: str


# --------------------------------------------------------------------------- #
# GET /api/product/{id}
# --------------------------------------------------------------------------- #


class PriceEntry(BaseModel):
    marketplace: str
    price: int
    price_formatted: str
    url: str
    is_lowest: bool = False
    note: str | None = None


class FitReason(BaseModel):
    icon: str
    title: str
    description: str


class SentimentScore(BaseModel):
    score: float
    review_count: int


class ProductDetailResponse(BaseModel):
    id: str
    name: str
    description: str = ""
    images: list[str] = Field(default_factory=list)
    badges: list[str] = Field(default_factory=list)
    prices: list[PriceEntry] = Field(default_factory=list)
    why_this_fits: str = ""
    fit_reasons: list[FitReason] = Field(default_factory=list)
    sentiment: dict[str, SentimentScore] = Field(default_factory=dict)
    pros: list[str] = Field(default_factory=list)
    cons: list[str] = Field(default_factory=list)
    specifications: dict[str, str] = Field(default_factory=dict)
    sources: list[str] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# GET /api/categories
# --------------------------------------------------------------------------- #


class Subcategory(BaseModel):
    id: str
    label: str


class Category(BaseModel):
    id: str
    label: str
    available: bool
    coming_soon: bool = False
    subcategories: list[Subcategory] = Field(default_factory=list)


class CategoriesResponse(BaseModel):
    categories: list[Category]


class MarketIntelligence(BaseModel):
    summary: str
    trends: list[str] = Field(default_factory=list)
    price_alerts: list[str] = Field(default_factory=list)


class CategoryDetailResponse(BaseModel):
    id: str
    label: str
    match_count: int
    location: str
    market_intelligence: MarketIntelligence
    products: list[ProductCard] = Field(default_factory=list)


# --------------------------------------------------------------------------- #
# GET /health
# --------------------------------------------------------------------------- #


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    services: dict[str, str]


# --------------------------------------------------------------------------- #
# Internal (not serialized to client directly) — agent results
# --------------------------------------------------------------------------- #


class IntentResult(BaseModel):
    category: Literal["electronics", "coming_soon", "ambiguous"]
    confidence: float = 0.0
    detected_intent: str = ""
    needs_clarification: bool = False
    clarification_reason: str | None = None


class RankedProduct(BaseModel):
    product_index: int
    score: float = 0.0
    pros: list[str] = Field(default_factory=list)
    cons: list[str] = Field(default_factory=list)
    ai_reasoning: str = ""
    is_editor_choice: bool = False


class RankingResult(BaseModel):
    summary: str = ""
    products: list[RankedProduct] = Field(default_factory=list)
