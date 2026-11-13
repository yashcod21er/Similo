"""Request and response models of the analysis endpoint (contract 1 of the Phase 6 brief).

JSON uses camelCase. Python code may use either spelling (``populate_by_name``), so the
evaluation runner can build requests with snake_case names.

Every list, string and base64 field has an upper limit, so one request cannot make the
service allocate an unbounded amount of memory. The whole body is also capped by
``max_request_bytes`` (16 MB) before it is parsed.
"""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

# --- limits ------------------------------------------------------------------------------
MAX_LOGOS = 5
MAX_PAGE_IMAGES = 12
MAX_TEXT_CHARS = 20_000
MAX_OCR_CHARS = 2_000
# base64 grows data by 4/3: 1 MB logo, 1.5 MB screenshot, 512 KB page image (+ padding).
MAX_LOGO_B64_CHARS = 1_400_000
MAX_SCREENSHOT_B64_CHARS = 2_100_000
MAX_PAGE_IMAGE_B64_CHARS = 700_000

Level = Literal["low", "medium", "high"]
ImageKind = Literal["favicon", "logo", "image"]
LogoSource = Literal["favicon", "logo", "image", "screenshot"]
LogoMethod = Literal["phash", "clip"]

# The eight signal ids of the contract (fixed).
SignalId = Literal[
    "domain_similarity",
    "logo_match",
    "text_similarity",
    "brand_mention",
    "credential_form",
    "payment_form",
    "new_domain",
    "new_certificate",
]


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")


# --- request -----------------------------------------------------------------------------
class BrandLogo(ApiModel):
    id: Annotated[str, Field(min_length=1, max_length=64)]
    image_base64: Annotated[str, Field(min_length=1, max_length=MAX_LOGO_B64_CHARS)]


class Brand(ApiModel):
    name: Annotated[str, Field(min_length=1, max_length=200)]
    description: Annotated[str, Field(max_length=2_000)] = ""
    keywords: Annotated[list[Annotated[str, Field(max_length=100)]], Field(max_length=50)] = []
    official_domains: Annotated[
        list[Annotated[str, Field(max_length=253)]], Field(max_length=50)
    ] = []
    logos: Annotated[list[BrandLogo], Field(max_length=MAX_LOGOS)] = []


class PageImage(ApiModel):
    kind: ImageKind
    image_base64: Annotated[str, Field(min_length=1, max_length=MAX_PAGE_IMAGE_B64_CHARS)]


class PageForms(ApiModel):
    has_password_field: bool = False
    has_payment_field: bool = False
    submits_to_other_domain: bool = False


class Page(ApiModel):
    final_url: Annotated[str, Field(max_length=2_048)] = ""
    title: Annotated[str, Field(max_length=1_000)] = ""
    text: Annotated[str, Field(max_length=MAX_TEXT_CHARS)] = ""
    screenshot_base64: Annotated[str | None, Field(max_length=MAX_SCREENSHOT_B64_CHARS)] = None
    images: Annotated[list[PageImage], Field(max_length=MAX_PAGE_IMAGES)] = []
    forms: PageForms = PageForms()
    certificate_issued_at: datetime | None = None


class Candidate(ApiModel):
    domain: Annotated[str, Field(min_length=1, max_length=253)]
    domain_score: Annotated[float, Field(ge=0, le=100)] = 0
    registered_at: datetime | None = None
    page: Page | None = None


class AnalyseRequest(ApiModel):
    brand: Brand
    candidate: Candidate


# --- response ----------------------------------------------------------------------------
class Signal(ApiModel):
    id: SignalId
    label: str
    value: float
    points: int
    max_points: int
    detail: str


class LogoMatch(ApiModel):
    logo_id: str
    source: LogoSource
    similarity: float
    method: LogoMethod


class ModelNames(ApiModel):
    text: str
    image: str
    ocr: str


class AnalyseResponse(ApiModel):
    model_version: str
    score: Annotated[int, Field(ge=0, le=100)]
    level: Level
    signals: list[Signal]
    reasons: list[str]
    unavailable: list[SignalId]
    ocr_text: Annotated[str, Field(max_length=MAX_OCR_CHARS)] = ""
    logo_match: LogoMatch | None = None
    models: ModelNames
