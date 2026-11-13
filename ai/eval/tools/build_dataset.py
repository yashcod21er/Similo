"""Generate the fictional-brand evaluation set: logos, HTML pages and the case manifest.

Run from `ai/`:   uv run python -m eval.tools.build_dataset
Then render:      node ai/eval/tools/render-pages.mjs     (from the repository root)

This writes (all under ai/eval/data/):
  brands.json            the protected fictional brands (name, keywords, domains, logo files)
  brands/<id>/logo-*.png generated logos (wordmark + icon)
  pages/<case>/          the HTML page (and its images) for every case that has a page
  manifest.json          one entry per case: domain, label, difficulty, notes, ages
The output is deterministic. Everything is fictional; see docs/EVALUATION.md.
"""

from __future__ import annotations

import json
import random
import shutil
from pathlib import Path

from PIL import Image

from eval.domain_score import domain_score
from eval.tools import content as C
from eval.tools import logos as L
from eval.tools import pages as P

DATA = Path(__file__).resolve().parents[1] / "data"
PAGES = DATA / "pages"

rng = random.Random(20260901)
BRANDS = {b["id"]: b for b in C.BRANDS}
cases: list[dict] = []


# ----- helpers -----


def look(spec: dict) -> dict:
    return {
        "color": spec["color"],
        "accent": spec["accent"],
        "ink": spec["ink"],
        "font": spec["font"],
    }


def brand_logo(brand_id: str, index: int) -> Image.Image:
    return Image.open(DATA / "brands" / brand_id / f"logo-{index}.png")


def write_page(case_id: str, html: str, assets: dict[str, Image.Image] | None = None) -> str:
    folder = PAGES / case_id
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "index.html").write_text(html, encoding="utf-8")
    for name, image in (assets or {}).items():
        L.save_png(image, folder / name)
    return case_id


def favicon_of(brand_id: str) -> Image.Image:
    return L.on_white(brand_logo(brand_id, 2)).resize((64, 64), Image.LANCZOS)


def add_case(
    case_id: str,
    brand_id: str,
    domain: str,
    lookalike: bool,
    category: str,
    difficulty: str,
    notes: str,
    page_dir: str | None,
    age_days: int | None,
    cert_days: int | None,
) -> None:
    brand = BRANDS[brand_id]
    cases.append(
        {
            "id": case_id,
            "brandId": brand_id,
            "domain": domain,
            "pageDir": page_dir,
            "domainScore": domain_score(
                domain, brand["name"], brand["keywords"], [brand["official"]]
            ),
            "registeredDaysAgo": age_days,
            "certificateDaysAgo": cert_days,
            "label": {
                "lookalike": lookalike,
                "category": category,
                "difficulty": difficulty,
                "notes": notes,
            },
        }
    )


def fake_collector(n: int) -> str:
    return f"https://collect-{n}.example.net/submit"


# ----- brands and logos -----


def make_brands() -> None:
    out = []
    for b in C.BRANDS:
        wordmark = L.draw_wordmark(b)
        icon = L.draw_icon(b)
        folder = DATA / "brands" / b["id"]
        L.save_png(wordmark.convert("RGB"), folder / "logo-1.png")
        L.save_png(icon, folder / "logo-2.png")
        out.append(
            {
                "id": b["id"],
                "name": b["name"],
                "sector": b["sector"],
                "description": b["description"],
                "keywords": b["keywords"],
                "officialDomains": [b["official"]],
                "logos": [
                    {
                        "id": f"{b['id']}-logo-1",
                        "file": f"brands/{b['id']}/logo-1.png",
                        "note": "wordmark",
                    },
                    {
                        "id": f"{b['id']}-logo-2",
                        "file": f"brands/{b['id']}/logo-2.png",
                        "note": "icon",
                    },
                ],
            }
        )
    note = (
        "Every brand, company, logo and domain in this evaluation set is fictional and was "
        "invented for testing. Domains use only reserved names (.example, .test, example.com/net/org)."
    )
    (DATA / "brands.json").write_text(
        json.dumps({"note": note, "brands": out}, indent=2) + "\n", encoding="utf-8"
    )


# ----- positives: look-alike pages -----


def make_positives() -> None:
    kinds = ["rotate", "crop-blur", "redraw"]
    old_ids = {
        "pos-plumbagopay-altered-logo",
        "pos-lumenhaven-clone-login",
        "pos-zephyrio-confusable",
        "pos-orbiqa-ocr-only",
        "pos-norvane-recoloured-payment",
    }
    for i, b in enumerate(C.BRANDS):
        bid = b["id"]
        doms = C.POSITIVE_DOMAINS[bid]
        wordmark, icon = brand_logo(bid, 1), brand_logo(bid, 2)

        def ages(
            case_id: str, young: tuple[int, int], cert: tuple[int, int], _old=old_ids
        ) -> tuple:
            if case_id in _old:
                return rng.randint(220, 900), rng.randint(40, 85)  # compromised older site
            return rng.randint(*young), rng.randint(*cert)

        # 1. exact copy: logo, name, sign-in form
        cid = f"pos-{bid}-clone-login"
        spec = {
            "look": look(b),
            "layout": "split" if i % 2 else "card",
            "logo": "logo.png",
            "logo_alt": b["name"],
            "name_text": None if i % 2 else b["name"],
            "title": f"{b['login_title']} | {b['name']}",
            "headline": b["login_title"],
            "sub": b["login_sub"],
            "tagline": b["tagline"],
            "features": b["features"],
            "form": "login",
            "button": "Sign in",
            "favicon": True,
            "form_action": fake_collector(i + 1) if i % 2 == 0 else "/login",
            "nav": ["Personal", "Business", "Help"],
            "footer": f"{b['name']}. All rights reserved.",
            "small": "Forgotten your password?",
        }
        age, cert = ages(cid, (2, 20), (1, 9))
        add_case(
            cid,
            bid,
            doms["clone"],
            True,
            "clone-login",
            "easy",
            "Official logo copied unchanged, brand name, sign-in form"
            + (", form posts to another domain." if i % 2 == 0 else "."),
            write_page(
                cid, P.brand_page(spec), {"logo.png": wordmark, "favicon.png": favicon_of(bid)}
            ),
            age,
            cert,
        )

        # 2. recoloured + resized logo: payment page (even) or marketing clone (odd)
        recoloured = L.scale_by(
            L.recolour(wordmark, C.RECOLOUR_TARGETS[i]), 0.75 if i % 2 == 0 else 1.15
        )
        if i % 2 == 0:
            cid = f"pos-{bid}-recoloured-payment"
            spec = {
                "look": look(b),
                "layout": "card",
                "logo": "logo.png",
                "logo_alt": b["name"],
                "name_text": b["name"],
                "title": f"{b['name']} - update your payment details",
                "headline": "Update your payment details",
                "sub": f"Your {b['name']} account could not be renewed. Enter a new card to keep it active.",
                "form": "payment",
                "button": "Confirm payment",
                "form_action": fake_collector(i + 20),
                "notice": "Action needed: your payment method has expired.",
                "nav": ["Account", "Billing", "Help"],
                "footer": f"{b['name']} customer billing.",
            }
            dom_notes = "Logo recoloured and shrunk, brand name in text, payment form posting to another domain."
            cat = "recoloured-payment"
        else:
            cid = f"pos-{bid}-recoloured-landing"
            spec = {
                "look": look(b),
                "layout": "hero",
                "logo": "logo.png",
                "logo_alt": b["name"],
                "name_text": None,
                "title": f"{b['name']} - {b['tagline']}",
                "headline": b["tagline"],
                "sub": f"Join {b['name']} today and see why customers choose us.",
                "features": b["features"],
                "cta": "Get started",
                "nav": ["Home", "Products", "Support"],
                "footer": f"{b['name']}. All rights reserved.",
            }
            dom_notes = "Marketing-page clone with a recoloured, enlarged logo; no form at all."
            cat = "recoloured-landing"
        age, cert = ages(cid, (5, 25), (3, 12))
        add_case(
            cid,
            bid,
            doms["recolour"],
            True,
            cat,
            "medium",
            dom_notes,
            write_page(cid, P.brand_page(spec), {"logo.png": recoloured}),
            age,
            cert,
        )

        # 3. slightly altered logo
        alteration = kinds[i % 3]
        if alteration == "redraw":
            altered = L.draw_wordmark({**b, "letter": "M" if b["letter"] != "M" else "W"})
            alteration_note = "icon letter swapped"
        else:
            altered = L.alter(wordmark, alteration)
            alteration_note = {
                "rotate": "rotated 6 degrees",
                "crop-blur": "cropped, blurred and re-compressed",
            }[alteration]
        cid = f"pos-{bid}-altered-logo"
        spec = {
            "look": look(b),
            "layout": "card",
            "logo": "logo.png",
            "logo_alt": "logo",
            "name_text": b["name"],
            "title": f"{b['name']} secure sign in",
            "headline": "Secure sign in",
            "sub": f"Sign in to {b['name']} to continue.",
            "form": "login",
            "button": "Continue",
            "form_action": "/auth",
            "nav": ["Help"],
            "footer": "Secure connection.",
        }
        age, cert = ages(cid, (12, 40), (4, 20))
        add_case(
            cid,
            bid,
            doms["typo"],
            True,
            "altered-logo",
            "medium",
            f"Logo altered ({alteration_note}), one-letter typo domain, sign-in form.",
            write_page(cid, P.brand_page(spec), {"logo.png": altered}),
            age,
            cert,
        )

        # 4. brand name only inside an image (needs OCR); generic domain
        cid = f"pos-{bid}-ocr-only"
        banner = L.text_banner(f"{b['name']} Secure Login", "#FFFFFF", b["color"])
        spec = {
            "look": look(b),
            "layout": "card",
            "logo": None,
            "name_text": None,
            "banner": "banner.png",
            "title": "Account Verification",
            "headline": "Verify your identity",
            "sub": "For your security, confirm your details to keep your account active.",
            "form": "login",
            "button": "Verify now",
            "form_action": fake_collector(i + 40),
            "footer": "Secure verification service.",
        }
        age, cert = ages(cid, (1, 10), (1, 8))
        add_case(
            cid,
            bid,
            doms["ocr"],
            True,
            "ocr-only",
            "hard",
            "Brand name only appears inside a banner image; page text and title are generic; "
            "generic domain with no resemblance to the brand.",
            write_page(cid, P.brand_page(spec), {"banner.png": banner}),
            age,
            cert,
        )

        # 5. confusable spelling of the name
        fake_name = b["confusable"]
        cid = f"pos-{bid}-confusable"
        small_icon = L.scale_by(icon, 0.3)
        spec = {
            "look": look(b),
            "layout": "card",
            "logo": "logo.png",
            "logo_alt": "",
            "logo_height": 44,
            "name_text": fake_name,
            "title": f"{fake_name} - Sign in",
            "headline": f"Welcome back to {fake_name}",
            "sub": "Sign in to continue to your account.",
            "form": "login",
            "button": "Sign in",
            "form_action": "/signin",
            "nav": ["Help", "Contact"],
            "footer": f"{fake_name} 2026",
        }
        age, cert = ages(cid, (7, 28), (2, 14))
        add_case(
            cid,
            bid,
            doms["confusable"],
            True,
            "confusable-spelling",
            "hard",
            f"Brand name spelled with look-alike characters ({fake_name}), small icon-only logo, sign-in form.",
            write_page(cid, P.brand_page(spec), {"logo.png": small_icon}),
            age,
            cert,
        )

    # 6. the whole page is one picture of a sign-in screen (three brands)
    for bid in ("norvane", "tallowmere", "marlowind"):
        b = BRANDS[bid]
        logo_y = 40 if bid == "norvane" else 110  # near the top, or lower down the page
        picture = L.login_screenshot_image(b, brand_logo(bid, 1), b["login_title"], logo_y)
        cid = f"pos-{bid}-picture-only"
        html = P.shell(
            "Welcome", "body{margin:0}img{display:block;width:100%}", '<img src="login.png" alt="">'
        )
        add_case(
            cid,
            bid,
            C.POSITIVE_DOMAINS[bid]["shot"],
            True,
            "picture-only",
            "hard",
            "The page is a single image of a sign-in screen: no text, no real form. Only the picture shows "
            f"the brand; the logo is {'near the top' if logo_y < 100 else 'lower down'} in the picture.",
            write_page(cid, html, {"login.png": picture}),
            rng.randint(3, 15),
            rng.randint(2, 9),
        )


# ----- negatives: pages that are not look-alikes -----


def old_age() -> tuple[int, int]:
    return rng.randint(400, 4000), rng.randint(15, 80)


def make_negatives() -> None:
    young = {
        "copperkettle",
        "tideline-fitness",
        "norvane-farm",
        "lumenhaven-bnb",
        "bargainly",
        "marlowind-kitchen",
    }

    def ages(key: str) -> tuple[int, int]:
        return (rng.randint(8, 25), rng.randint(3, 10)) if key in young else old_age()

    # unrelated businesses
    for biz in C.BUSINESSES:
        age, cert = ages(biz["id"])
        add_case(
            f"neg-business-{biz['id']}",
            biz["vs"],
            biz["domain"],
            False,
            "unrelated-business",
            "easy",
            f"{biz['name']}: ordinary local business, no connection to the brand"
            + (", has a contact form" if biz.get("contact_form") else "")
            + ".",
            write_page(f"neg-business-{biz['id']}", P.business_page(biz)),
            age,
            cert,
        )

    # different business sharing a word or the whole name
    for biz in C.COMMON_WORD:
        age, cert = ages(biz["id"])
        add_case(
            f"neg-sameword-{biz['id']}",
            biz["vs"],
            biz["domain"],
            False,
            "shared-word",
            "hard",
            f"{biz['name']}: a different business that uses the brand's word, so the domain and text look similar.",
            write_page(f"neg-sameword-{biz['id']}", P.business_page(biz)),
            age,
            cert,
        )

    # sign-in / payment pages of other fictional brands styled like the protected brand
    for ob in C.OTHER_BRANDS:
        age, cert = ages(ob["id"])
        spec_logo = L.draw_wordmark(ob)
        icon = L.draw_icon(ob).resize((64, 64), Image.LANCZOS)
        spec = {
            "look": look(ob),
            "layout": ob["layout"],
            "logo": "logo.png",
            "logo_alt": ob["name"],
            "name_text": ob["name"] if ob["layout"] == "card" else None,
            "title": f"{ob['login_title']} | {ob['name']}",
            "headline": ob["login_title"],
            "sub": ob["login_sub"],
            "tagline": ob["tagline"],
            "features": ob["features"],
            "form": ob["form"],
            "button": "Pay now" if ob["form"] == "payment" else "Sign in",
            "form_action": "/submit",
            "favicon": True,
            "nav": ["Home", "Help"],
            "footer": f"{ob['name']}. All rights reserved.",
        }
        add_case(
            f"neg-login-{ob['id']}",
            ob["vs"],
            ob["domain"],
            False,
            "other-brand-login",
            "hard",
            f"{ob['name']}: a real-looking {ob['form']} page for a different (fictional) company in the same "
            "sector, with a logo in a similar colour palette."
            + (
                " It also uses a ring-and-dot icon like the protected brand's, in another colour."
                if ob["id"] == "bargainly"
                else ""
            ),
            write_page(
                f"neg-login-{ob['id']}",
                P.brand_page(spec),
                {"logo.png": spec_logo, "favicon.png": icon},
            ),
            age,
            cert,
        )

    # parked, coming soon, default pages
    for item in C.PARKED:
        similar = item["id"] != "parked-default-server"
        add_case(
            item["id"],
            item["vs"],
            item["domain"],
            False,
            "parked-empty",
            "medium" if similar else "easy",
            "Empty page ("
            + item["kind"]
            + ")"
            + (
                " on a domain that resembles the brand; nothing on the page imitates it."
                if similar
                else "."
            ),
            write_page(item["id"], P.parked_page(item["kind"], item["domain"])),
            *old_age(),
        )

    # news and blog articles
    for art in C.NEWS:
        assets = {}
        art = dict(art)
        if art["image"] == "brand-logo":
            assets["article.png"] = brand_logo(art["vs"], 1)
        elif art["image"] == "brand-icon":
            assets["article.png"] = L.on_white(brand_logo(art["vs"], 2))
        art["image"] = "article.png" if assets else None
        age, cert = old_age()
        add_case(
            art["id"],
            art["vs"],
            art["domain"],
            False,
            "news-mention",
            "hard" if assets else "medium",
            "News/blog article that names the brand several times"
            + (" and shows its real logo as an illustration" if assets else "")
            + "; no form.",
            write_page(art["id"], P.article_page(art), assets),
            age,
            cert,
        )

    # independent review / comparison sites
    for rev in C.REVIEWS:
        add_case(
            rev["id"],
            rev["vs"],
            rev["domain"],
            False,
            "review-site",
            "hard",
            "Independent review site: brand name in the title and domain, but it is commentary, not an imitation.",
            write_page(rev["id"], P.review_page(rev)),
            *old_age(),
        )


def make_domain_only() -> None:
    for n, (bid, domain) in enumerate(C.DOMAIN_ONLY_POSITIVE, 1):
        add_case(
            f"dom-pos-{n}",
            bid,
            domain,
            True,
            "domain-only-lookalike",
            "medium",
            "Site could not be captured; the domain imitates the brand name.",
            None,
            rng.randint(2, 30),
            rng.randint(1, 12),
        )
    for n, (bid, domain) in enumerate(C.DOMAIN_ONLY_NEGATIVE, 1):
        brand = BRANDS[bid]
        shares = domain_score(domain, brand["name"], brand["keywords"], [brand["official"]]) >= 65
        add_case(
            f"dom-neg-{n}",
            bid,
            domain,
            False,
            "domain-only-unrelated",
            "hard" if shares else "medium",
            "Site could not be captured; the domain belongs to an unrelated business"
            + (" that happens to use the brand's word." if shares else "."),
            None,
            *old_age(),
        )


def main() -> None:
    if PAGES.exists():
        shutil.rmtree(PAGES)
    make_brands()
    make_positives()
    make_negatives()
    make_domain_only()
    manifest = {
        "note": "Fictional evaluation cases. 'lookalike' is the label set by the dataset author.",
        "cases": cases,
    }
    (DATA / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    pos = sum(1 for c in cases if c["label"]["lookalike"])
    print(
        f"{len(cases)} cases: {pos} look-alikes, {len(cases) - pos} benign; "
        f"{sum(1 for c in cases if c['pageDir'] is None)} domain-only"
    )
    for case in cases:
        print(
            f"{case['id']:<42} {case['domain']:<42} score={case['domainScore']:>3} "
            f"{'LOOKALIKE' if case['label']['lookalike'] else 'benign'}"
        )


if __name__ == "__main__":
    main()
