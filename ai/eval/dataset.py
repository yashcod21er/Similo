"""Load the fictional evaluation set and turn a case into a contract-1 request."""

from __future__ import annotations

import base64
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent / "data"


def load_brands(data_dir: Path = DATA_DIR) -> dict[str, dict[str, Any]]:
    """The protected fictional brands by id, with each logo file read as base64."""
    raw = json.loads((data_dir / "brands.json").read_text(encoding="utf-8"))
    brands: dict[str, dict[str, Any]] = {}
    for brand in raw["brands"]:
        logos = [
            {
                "id": logo["id"],
                "imageBase64": base64.b64encode((data_dir / logo["file"]).read_bytes()).decode(),
            }
            for logo in brand["logos"]
        ]
        brands[brand["id"]] = {
            "name": brand["name"],
            "description": brand["description"],
            "keywords": brand["keywords"],
            "officialDomains": brand["officialDomains"],
            "logos": logos,
        }
    return brands


def load_cases(data_dir: Path = DATA_DIR) -> list[dict[str, Any]]:
    """All case fixtures (written by tools/render-pages.mjs), page cases first, then by id."""
    files = sorted((data_dir / "cases").glob("*.json"))
    if not files:
        raise FileNotFoundError(
            "No case fixtures found. Run `uv run python -m eval.tools.build_dataset` and then "
            "`node ai/eval/tools/render-pages.mjs` from the repository root."
        )
    cases = [json.loads(path.read_text(encoding="utf-8")) for path in files]
    return sorted(cases, key=lambda c: (c["candidate"]["page"] is None, c["id"]))


def build_request(
    case: dict[str, Any], brands: dict[str, dict[str, Any]], now: datetime
) -> dict[str, Any]:
    """Contract-1 request JSON. Ages are stored as 'days ago' so the set never goes stale."""
    candidate = json.loads(json.dumps(case["candidate"]))  # deep copy
    meta = case.get("meta", {})
    if meta.get("registeredDaysAgo") is not None:
        candidate["registeredAt"] = _iso(now - timedelta(days=meta["registeredDaysAgo"]))
    if candidate.get("page") is not None and meta.get("certificateDaysAgo") is not None:
        candidate["page"]["certificateIssuedAt"] = _iso(
            now - timedelta(days=meta["certificateDaysAgo"])
        )
    return {"brand": brands[case["brandId"]], "candidate": candidate}


def _iso(moment: datetime) -> str:
    return moment.strftime("%Y-%m-%dT%H:%M:%SZ")
