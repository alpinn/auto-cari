"""Pydantic request models."""

from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    query: str = Field(..., description="Raw user query", examples=["laptop buat coding budget 8 juta"])
    clarification: str | None = Field(
        default=None,
        description="Selected clarification option/text from a previous clarifying response",
    )
    session_id: str | None = Field(default=None, description="Optional client session UUID")


class WaitlistRequest(BaseModel):
    email: str = Field(..., max_length=255)
    category: str = Field(..., max_length=50)
