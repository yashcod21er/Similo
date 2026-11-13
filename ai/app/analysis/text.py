"""Text similarity: how close is the page's wording to the brand's own description?

Method: MiniLM sentence embeddings (384-d, unit length) and cosine similarity between
  brand profile = "name. description. keywords"
  page text     = "title. first ~2 000 characters of the visible text"
The score says "this page talks about similar things as the brand". It is weak evidence on
its own: a short brand profile (just a name) produces low similarities even for a copy.
"""

from app.analysis.models_loader import ModelRegistry

PAGE_TEXT_CHARS = 2_000  # roughly the first 450 tokens, close to MiniLM's 512-token window


def brand_profile_text(name: str, description: str, keywords: list[str]) -> str:
    parts = [name.strip(), description.strip(), ", ".join(k.strip() for k in keywords if k.strip())]
    return ". ".join(part for part in parts if part)


def page_text_for_embedding(title: str, text: str) -> str:
    snippet = " ".join(text.split())[:PAGE_TEXT_CHARS]
    parts = [" ".join(title.split()), snippet]
    return ". ".join(part for part in parts if part)


def cosine(left: list[float], right: list[float]) -> float:
    dot = sum(a * b for a, b in zip(left, right, strict=True))
    norm = (sum(a * a for a in left) ** 0.5) * (sum(b * b for b in right) ** 0.5)
    return dot / norm if norm else 0.0


def text_similarity(
    registry: ModelRegistry,
    *,
    brand_name: str,
    brand_description: str,
    brand_keywords: list[str],
    page_title: str,
    page_text: str,
) -> float | None:
    """Cosine similarity in [0, 1] (negative values are clamped to 0), or None if no text."""
    page = page_text_for_embedding(page_title, page_text)
    profile = brand_profile_text(brand_name, brand_description, brand_keywords)
    if not page or not profile:
        return None
    profile_vector, page_vector = registry.embed_texts([profile, page])
    return max(0.0, min(1.0, cosine(profile_vector, page_vector)))
