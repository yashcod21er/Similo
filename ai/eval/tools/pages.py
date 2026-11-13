"""HTML templates for the evaluation pages. Every page is self-contained (no network).

All names, brands and sentences are invented. Pages load only files stored next to them.
"""

from __future__ import annotations

from html import escape as esc

FONTS = {
    "sans": "'Segoe UI', Arial, Helvetica, sans-serif",
    "serif": "Georgia, 'Times New Roman', serif",
    "round": "'Trebuchet MS', Verdana, sans-serif",
}


def shell(title: str, css: str, body: str, favicon: bool = False) -> str:
    icon = '<link rel="icon" type="image/png" href="favicon.png">' if favicon else ""
    return (
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1">'
        f"<title>{esc(title)}</title>{icon}<style>{css}</style></head><body>{body}</body></html>"
    )


def base_css(look: dict) -> str:
    return f"""
*{{box-sizing:border-box}}
body{{margin:0;font-family:{FONTS[look.get("font", "sans")]};color:{look["ink"]};background:#f6f7f9;line-height:1.5}}
a{{color:{look["color"]};text-decoration:none}}
header.top{{display:flex;align-items:center;gap:16px;padding:16px 48px;background:#fff;border-bottom:1px solid #e1e4e8}}
header.top img{{display:block}}
header.top .name{{font-weight:700;font-size:22px;color:{look["color"]}}}
header.top nav{{margin-left:auto;display:flex;gap:26px;font-size:15px}}
.center{{display:flex;justify-content:center;padding:44px 16px}}
.card{{width:480px;background:#fff;border:1px solid #dde1e6;border-radius:{look.get("radius", 10)}px;padding:34px}}
.card h1{{margin:0 0 6px;font-size:26px}}
.card p.sub{{margin:0 0 20px;color:#59636e;font-size:15px}}
.card img.banner{{display:block;width:100%;margin-bottom:18px;border-radius:6px}}
.notice{{background:#fff4e0;border:1px solid #f0d49a;border-radius:6px;padding:10px 12px;font-size:14px;margin-bottom:16px}}
label{{display:block;font-size:13px;font-weight:600;margin:14px 0 5px}}
input[type=text],input[type=email],input[type=password],input[type=tel]{{width:100%;padding:11px 12px;border:1px solid #b8bec6;border-radius:6px;font-size:15px}}
.row{{display:flex;gap:12px}}.row>div{{flex:1}}
button.btn,a.cta{{display:inline-block;margin-top:20px;padding:12px 22px;background:{look["color"]};color:#fff;border:0;border-radius:{look.get("radius", 10)}px;font-size:16px;font-weight:600;cursor:pointer}}
.card button.btn{{width:100%}}
.small{{font-size:13px;color:#69727d}}
.split{{display:flex;min-height:800px}}
.split aside{{flex:0 0 46%;background:{look["color"]};color:#fff;padding:60px 56px}}
.split aside .logobox{{display:inline-block;background:#fff;padding:14px 20px;border-radius:12px}}
.split aside h2{{font-size:34px;margin:44px 0 14px;line-height:1.2}}
.split aside li{{margin:8px 0}}
.split main{{flex:1;display:flex;align-items:center;justify-content:center;padding:30px}}
.hero{{background:{look["color"]};color:#fff;padding:78px 48px 70px}}
.hero h1{{font-size:46px;margin:0 0 14px;max-width:720px;line-height:1.15}}
.hero p{{font-size:20px;max-width:640px;margin:0}}
.hero a.cta{{background:{look["accent"]};color:#1b1b1b}}
.features{{display:flex;gap:24px;padding:40px 48px}}
.features div{{flex:1;background:#fff;border:1px solid #e1e4e8;border-radius:10px;padding:22px}}
.features h3{{margin:0 0 6px;font-size:18px;color:{look["color"]}}}
.formband{{padding:10px 48px 40px;display:flex;justify-content:center}}
footer{{padding:22px 48px;font-size:13px;color:#69727d;border-top:1px solid #e1e4e8;background:#fff}}
"""


def _form_html(kind: str | None, action: str, button: str) -> str:
    if kind == "login":
        return (
            f'<form method="post" action="{esc(action)}">'
            '<label for="email">Email address</label><input id="email" name="email" type="email">'
            '<label for="pw">Password</label><input id="pw" name="password" type="password">'
            f'<button class="btn" type="submit">{esc(button)}</button></form>'
        )
    if kind == "payment":
        return (
            f'<form method="post" action="{esc(action)}">'
            '<label for="holder">Name on card</label><input id="holder" name="holder" type="text" autocomplete="cc-name">'
            '<label for="cardnumber">Card number</label><input id="cardnumber" name="cardnumber" type="text" autocomplete="cc-number" placeholder="1234 5678 9012 3456">'
            '<div class="row"><div><label for="exp">Expiry date</label><input id="exp" name="exp" type="text" autocomplete="cc-exp" placeholder="MM/YY"></div>'
            '<div><label for="cvv">Security code (CVV)</label><input id="cvv" name="cvv" type="text" autocomplete="cc-csc" placeholder="123"></div></div>'
            f'<button class="btn" type="submit">{esc(button)}</button></form>'
        )
    return ""


def _head_bar(spec: dict) -> str:
    logo = (
        f'<img class="logo" src="{spec["logo"]}" alt="{esc(spec.get("logo_alt", ""))}" '
        f'style="height:{spec.get("logo_height", 40)}px">'
        if spec.get("logo")
        else ""
    )
    name = f'<span class="name">{esc(spec["name_text"])}</span>' if spec.get("name_text") else ""
    nav = "".join(f'<a href="#">{esc(n)}</a>' for n in spec.get("nav", []))
    return f'<header class="top">{logo}{name}<nav>{nav}</nav></header>'


def brand_page(spec: dict) -> str:
    """A sign-in, payment or marketing page in a brand's colours (real brand or imitation)."""
    look = spec["look"]
    layout = spec.get("layout", "card")
    form = _form_html(
        spec.get("form"), spec.get("form_action", "/submit"), spec.get("button", "Continue")
    )
    notice = f'<div class="notice">{esc(spec["notice"])}</div>' if spec.get("notice") else ""
    banner = f'<img class="banner" src="{spec["banner"]}" alt="">' if spec.get("banner") else ""
    heading = f'<h1>{esc(spec["headline"])}</h1><p class="sub">{esc(spec.get("sub", ""))}</p>'
    footer = f"<footer>{esc(spec.get('footer', ''))}</footer>"
    features = "".join(
        f"<div><h3>{esc(f[0])}</h3><p>{esc(f[1])}</p></div>" for f in spec.get("features", [])
    )

    if layout == "split":
        logo = (
            f'<span class="logobox"><img src="{spec["logo"]}" alt="logo" style="height:{spec.get("logo_height", 44)}px;display:block"></span>'
            if spec.get("logo")
            else (
                f'<h1 style="margin:0">{esc(spec["name_text"])}</h1>'
                if spec.get("name_text")
                else ""
            )
        )
        items = "".join(f"<li>{esc(f[0])}</li>" for f in spec.get("features", []))
        body = (
            f'<div class="split"><aside>{logo}<h2>{esc(spec.get("tagline", spec["headline"]))}</h2>'
            f'<ul>{items}</ul></aside><main><section class="card">{banner}{heading}{notice}{form}'
            f'<p class="small">{esc(spec.get("small", ""))}</p></section></main></div>'
        )
    elif layout == "hero":
        cta = (
            f'<a class="cta" href="#">{esc(spec.get("cta", "Get started"))}</a>'
            if spec.get("cta")
            else ""
        )
        band = (
            f'<section class="formband"><div class="card">{notice}<h1 style="font-size:22px">'
            f"{esc(spec.get('form_title', ''))}</h1>{form}</div></section>"
            if form
            else ""
        )
        body = (
            f'{_head_bar(spec)}<section class="hero"><h1>{esc(spec["headline"])}</h1>'
            f"<p>{esc(spec.get('sub', ''))}</p>{cta}</section>"
            f'<section class="features">{features}</section>{band}{footer}'
        )
    else:
        body = (
            f'{_head_bar(spec)}<div class="center"><section class="card">{banner}{heading}{notice}{form}'
            f'<p class="small">{esc(spec.get("small", ""))}</p></section></div>{footer}'
        )
    return shell(spec["title"], base_css(look), body, favicon=bool(spec.get("favicon")))


# ----- pages that are not a brand site -----

PALETTES = {
    "forest": ("#2f6b3a", "#f2c14e"),
    "brick": ("#a4492e", "#f4d6a0"),
    "ocean": ("#1d6fa5", "#ffd166"),
    "plum": ("#8a3b55", "#f6d8a8"),
    "slate": ("#3c4a5a", "#e9b44c"),
    "olive": ("#6b7d2c", "#f3e2a9"),
    "sand": ("#9a7b4f", "#2b3a42"),
    "rose": ("#b04a5a", "#f6e3c0"),
    "teal": ("#1f7a78", "#f4d35e"),
    "ink": ("#222b36", "#f0a04b"),
}


def business_page(biz: dict) -> str:
    """Ordinary small-business site: headline, services, contact. No brand logo image."""
    color, accent = PALETTES[biz["palette"]]
    look = {"color": color, "accent": accent, "ink": "#1d2630", "font": biz.get("font", "sans")}
    services = "".join(f"<div><h3>{esc(a)}</h3><p>{esc(b)}</p></div>" for a, b in biz["services"])
    contact = ""
    if biz.get("contact_form"):
        contact = (
            '<section class="formband"><div class="card"><h1 style="font-size:22px">Get in touch</h1>'
            '<form method="post" action="/contact"><label for="n">Your name</label><input id="n" name="name" type="text">'
            '<label for="e">Email address</label><input id="e" name="email" type="email">'
            '<button class="btn" type="submit">Send message</button></form></div></section>'
        )
    body = (
        f'<header class="top"><span class="name">{esc(biz["name"])}</span>'
        '<nav><a href="#">Home</a><a href="#">Services</a><a href="#">About</a><a href="#">Contact</a></nav></header>'
        f'<section class="hero"><h1>{esc(biz["headline"])}</h1><p>{esc(biz["sub"])}</p></section>'
        f'<section class="features">{services}</section>{contact}'
        f"<footer>{esc(biz['name'])} &middot; {esc(biz['address'])} &middot; {esc(biz['hours'])}</footer>"
    )
    return shell(biz["title"], base_css(look), body)


def article_page(art: dict) -> str:
    """News or blog article. May show a logo as an illustration."""
    paragraphs = "".join(f"<p>{esc(p)}</p>" for p in art["paragraphs"])
    figure = (
        f'<figure><img src="{art["image"]}" alt="{esc(art.get("image_alt", "illustration"))}" '
        f'style="height:{art.get("image_height", 90)}px;display:block;border:1px solid #ddd">'
        f"<figcaption>{esc(art.get('caption', ''))}</figcaption></figure>"
        if art.get("image")
        else ""
    )
    css = f"""
*{{box-sizing:border-box}}body{{margin:0;font-family:{FONTS["serif"]};background:#fbfaf7;color:#222;line-height:1.65}}
header{{background:#1f2933;color:#fff;padding:18px 48px;font-family:{FONTS["sans"]};font-size:24px;font-weight:700;letter-spacing:.5px}}
header span{{font-weight:400;font-size:14px;margin-left:18px;opacity:.8}}
article{{max-width:760px;margin:36px auto;padding:0 20px}}h1{{font-size:38px;line-height:1.2;margin:0 0 8px}}
.by{{font-family:{FONTS["sans"]};font-size:14px;color:#66707a;margin-bottom:24px}}p{{font-size:19px}}
figure{{margin:22px 0}}figcaption{{font-size:14px;color:#66707a;font-family:{FONTS["sans"]}}}
footer{{padding:20px 48px;font-family:{FONTS["sans"]};font-size:13px;color:#66707a;border-top:1px solid #ddd}}
"""
    body = (
        f"<header>{esc(art['site'])}<span>{esc(art.get('tagline', 'Independent reporting'))}</span></header>"
        f'<article><h1>{esc(art["headline"])}</h1><div class="by">{esc(art["byline"])}</div>'
        f"{figure}{paragraphs}</article><footer>&copy; {esc(art['site'])}. All rights reserved.</footer>"
    )
    return shell(art["title"], css, body, favicon=bool(art.get("favicon")))


def review_page(rev: dict) -> str:
    """Independent review / comparison site (mentions the brand a lot, but is not the brand)."""
    pros = "".join(f"<li>{esc(p)}</li>" for p in rev["pros"])
    cons = "".join(f"<li>{esc(c)}</li>" for c in rev["cons"])
    css = f"""
*{{box-sizing:border-box}}body{{margin:0;font-family:{FONTS["sans"]};background:#f3f6f4;color:#1f2a24;line-height:1.6}}
header{{background:#fff;border-bottom:3px solid #2e8b57;padding:16px 48px;font-size:22px;font-weight:700;color:#2e8b57}}
main{{max-width:820px;margin:34px auto;padding:0 20px}}h1{{font-size:34px;margin:0 0 6px}}
.score{{display:inline-block;background:#2e8b57;color:#fff;border-radius:8px;padding:6px 14px;font-weight:700;margin:10px 0 18px}}
.cols{{display:flex;gap:24px}}.cols div{{flex:1;background:#fff;border:1px solid #d9e2dc;border-radius:10px;padding:16px 22px}}
footer{{padding:20px 48px;font-size:13px;color:#68756d}}
"""
    body = (
        f"<header>{esc(rev['site'])}</header><main><h1>{esc(rev['headline'])}</h1>"
        f'<div class="score">Our rating: {esc(rev["rating"])}</div><p>{esc(rev["intro"])}</p>'
        f'<div class="cols"><div><h3>Good</h3><ul>{pros}</ul></div><div><h3>Not so good</h3><ul>{cons}</ul></div></div>'
        f"<p>{esc(rev['verdict'])}</p></main><footer>{esc(rev['site'])} is not affiliated with the companies it reviews.</footer>"
    )
    return shell(rev["title"], css, body)


def parked_page(kind: str, domain: str) -> str:
    """Registrar parking, coming-soon, under-construction and default server pages."""
    css = f"""*{{box-sizing:border-box}}body{{margin:0;min-height:800px;display:flex;align-items:center;justify-content:center;
font-family:{FONTS["sans"]};text-align:center;background:#eef1f4;color:#2a3440}}
.box{{max-width:640px;padding:40px}}h1{{font-size:44px;margin:0 0 12px}}p{{font-size:19px;color:#566270}}
.pill{{display:inline-block;margin-top:18px;padding:10px 24px;border-radius:999px;background:#2a3440;color:#fff;font-size:16px}}"""
    if kind == "sale":
        inner = f'<h1>{esc(domain)}</h1><p>This domain may be for sale. Make an offer to the owner.</p><span class="pill">Contact the owner</span>'
        title = f"{domain} - domain for sale"
    elif kind == "coming-soon":
        inner = '<h1>Something new is coming</h1><p>We are working on our new website. Please check back soon.</p><span class="pill">Coming soon</span>'
        title = "Coming soon"
    elif kind == "construction":
        inner = "<h1>Site under construction</h1><p>Our website is being rebuilt. Thank you for your patience.</p>"
        title = "Under construction"
    elif kind == "default-server":
        inner = "<h1>It works!</h1><p>This is the default web page for this server. The web server software is running but no content has been added yet.</p>"
        title = "Test Page for the web server"
    else:
        raise ValueError(kind)
    return shell(title, css, f'<div class="box">{inner}</div>')
