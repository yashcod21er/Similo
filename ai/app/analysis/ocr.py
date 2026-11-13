"""OCR of the page screenshot (RapidOCR), to read text that is drawn inside images.

Look-alike sites often put the brand name only inside a banner or logo image, where page
text extraction cannot see it. The recognised text is returned (at most 2 000 characters) so
the brand-mention check can use it and a person can see what the AI read.
"""

import numpy as np
from PIL import Image

from app.analysis.models import MAX_OCR_CHARS
from app.analysis.models_loader import ModelRegistry

MIN_CONFIDENCE = 0.5  # RapidOCR line confidence (0-1) below which a line is dropped


def read_text(registry: ModelRegistry, screenshot: Image.Image) -> str:
    """Return the text found in the screenshot, one line per text line, capped in length."""
    output = registry.run_ocr(np.asarray(screenshot))
    texts = getattr(output, "txts", None)
    if not texts:
        return ""
    scores = getattr(output, "scores", None)
    lines: list[str] = []
    for index, text in enumerate(texts):
        score = scores[index] if scores is not None and index < len(scores) else 1.0
        cleaned = " ".join(str(text).split())
        if cleaned and float(score) >= MIN_CONFIDENCE:
            lines.append(cleaned)
    return "\n".join(lines)[:MAX_OCR_CHARS]
