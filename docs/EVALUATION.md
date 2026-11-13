# Evaluation of the look-alike analysis

Phase 6 adds an explainable risk score to every finding (`ai/app/analysis/`). This page
explains how we test that score, what the test can and cannot tell us, and the current
results. The evaluation code is in `ai/eval/`.

> **Read this first.** The data is **fictional and made by us**. Every brand, company, logo,
> page and domain was invented for this test, and the "look-alike" pages were written by the
> same person who knows how the detector works. Synthetic data like this is **easier than real
> attacks**, so the numbers are optimistic. **Do not quote them as real-world accuracy.** Use
> them to compare one version of the scoring with another, and to find bugs.

## 1. Purpose

- Check that the eight signals behave as designed (a copied logo scores, an ordinary login
  page does not).
- Give the team a repeatable test: change a weight or a threshold, run one command, see
  whether precision, recall and the false positives got better or worse.
- Find weak spots early (see the observations below, which already found real problems).
- Choose the `medium` and `high` thresholds from evidence instead of guessing.

It does **not** prove how well Similo works against real phishing. That needs real, labelled
look-alike sites collected over time, which we do not have yet.

## 2. What is measured

The unit is one **case**: a protected brand plus one candidate domain, with or without a
captured page (contract 1 of the AI service). `analyse()` returns a score from 0 to 100 and a
level (`low`, `medium` from 40, `high` from 70).

- **Label.** `lookalike = true` means the page (or domain) imitates the protected brand to
  deceive people. Everything else is `false`, including legitimate businesses that happen to
  share a word, news articles, independent review sites and empty parked pages on
  similar-looking domains. The label is set by the dataset author (see limitations).
- **Positive class** = look-alike. A page is "flagged" when its score reaches the threshold
  (`medium` 40 or `high` 70).
- **Precision** = of the pages we flagged, how many really were look-alikes.
  **Recall** = of the real look-alikes, how many we flagged. **F1** combines the two.
  **AUC** = the chance that a random look-alike scores higher than a random benign page
  (1.0 perfect, 0.5 guessing). AUC does not depend on the threshold.
- **Per signal.** Each of the eight signals is also scored on its own ("fires" = earns more
  than 0 points), and the score is recomputed with each signal removed.
- **Pipeline-realistic subset.** The monitoring step only sends a candidate for page analysis
  when its name score is high enough (65 at the default sensitivity). The tables therefore
  also show the cases with a name score of at least 65. Cases with a generic domain
  (look-alikes that do not resemble the name at all) would never reach analysis today; they
  are in the set to test the page signals on their own.
- **Domain only.** Cases with `page: null` model a site that could not be captured. At most
  `domain_similarity` (25) and `new_domain` (5) can score, so they can never reach `medium`.

## 3. The dataset

### 3.1 Fictional brands

All eight are invented. The names were checked by eye to not be obvious real companies, but
a similar name may exist somewhere: that would be a coincidence, not a reference. All domains
use reserved names only (`.example`, `.test`, or `example.com`, `example.net`, `example.org`
subdomains), so nothing resolves on the internet. No real logo, company name or phishing page
is used. The logos are drawn with Pillow from simple shapes and the default font.

| Brand | Sector | Official domain | Logo (invented) |
|---|---|---|---|
| Norvane Bank | banking | `norvane.example` | navy shield with N |
| Zephyrio Mail | email | `zephyrio.example` | blue circle with Z |
| Kestrel & Fenn | insurance | `kestrelfenn.example` | green triangle with K |
| Plumbago Pay | payments | `plumbagopay.example` | teal hexagon with P |
| Tallowmere Cloud | cloud storage | `tallowmere.example` | orange cloud |
| Orbiqa Shop | online shopping | `orbiqa.example` | red ring with a dot |
| Lumenhaven Energy | energy | `lumenhaven.example` | yellow diamond with L |
| Marlowind Travel | travel | `marlowind.example` | dark paper plane |

Each brand has a name, a one-sentence description, two keywords, one official domain and two
logos (a wordmark and an icon-only version with a transparent background).

### 3.2 Cases (95)

| Group | Category | Cases | Difficulty | What it is |
|---|---|---:|---|---|
| Look-alike | `clone-login` | 8 | easy | Official logo copied unchanged, brand name, sign-in form |
| Look-alike | `recoloured-payment` | 4 | medium | Logo recoloured and resized, card-payment form |
| Look-alike | `recoloured-landing` | 4 | medium | Recoloured, enlarged logo on a marketing clone, no form |
| Look-alike | `altered-logo` | 8 | medium | Logo rotated, blurred or with a changed letter; one-letter typo domain |
| Look-alike | `confusable-spelling` | 8 | hard | Name spelled with look-alike characters (`N0rvane`), small icon |
| Look-alike | `ocr-only` | 8 | hard | Brand name only inside a banner image, generic text and domain |
| Look-alike | `picture-only` | 3 | hard | Page is one picture of a sign-in screen |
| Look-alike | `domain-only-lookalike` | 6 | medium | Page not captured, imitation domain |
| Benign | `unrelated-business` | 10 | easy | Bakery, dentist, law firm and similar local businesses |
| Benign | `shared-word` | 8 | hard | A different business using the brand's word (or full name) |
| Benign | `other-brand-login` | 8 | hard | Sign-in or checkout page of another fictional company in the same sector, similar colours |
| Benign | `parked-empty` | 5 | medium/easy | "Coming soon", "for sale", default server page, some on look-alike domains |
| Benign | `news-mention` | 6 | medium/hard | News or blog article naming the brand; two show its real logo |
| Benign | `review-site` | 3 | hard | Independent review or comparison site |
| Benign | `domain-only-unrelated` | 6 | medium/hard | Page not captured, unrelated domain (two share the brand's word) |

49 look-alikes and 46 benign cases; 83 have a captured page and 12 are domain-only.
Registration and certificate ages are stored as "days ago" and turned into dates when the
run starts, so the set does not go out of date. Most look-alikes are young (days to weeks)
but five are old compromised sites; most benign cases are years old but six are new small
businesses.

### 3.3 How the data was made

1. `ai/eval/tools/build_dataset.py` writes the brands, logos, one HTML page per case
   (`ai/eval/data/pages/<case>/`) and `manifest.json` (label, difficulty, notes, ages, and the
   Phase 5 name score for the domain). The name score comes from `eval/domain_score.py`, a
   Python port of `backend/src/modules/monitoring/similarity.ts` (tested in
   `eval/tests/test_domain_score.py`).
2. `ai/eval/tools/render-pages.mjs` (offline tooling, not part of the product) opens each
   page from disk in Edge with Playwright at 1280x800, saves a JPEG screenshot (at most
   150 KB), and extracts the title, visible text, form flags and images the way the capture
   step does. It refuses any network request. The output is one fixture per case in
   `ai/eval/data/cases/<case>.json` (the `candidate` part of the contract-1 request, plus
   the label).
3. `ai/eval/dataset.py` builds the full request (brand with its logos plus candidate) and
   `ai/eval/run.py` calls `analyse()` in-process with the real models.

Committed data is about 8 MB (screenshots 16-61 KB each).

## 4. Limitations

Please keep these in mind whenever a number from this page is used.

1. **Synthetic and easier than reality.** We wrote both the look-alikes and the benign pages.
   Our pages are small and clean (100-600 characters of text, no scripts, no pop-ups, no
   cookie banners, one language, one font). Real phishing kits copy a real site's HTML, CSS
   and images; real benign sites are huge, messy and varied. The real error rate will be
   higher.
2. **Small.** 95 cases and 8 brands. One case is about 1-2 percentage points of recall, so
   differences of a few points are noise. Eight brands share one generator, so cases of one
   kind are very alike.
3. **The author sets the labels.** Some are judgement calls: we call a parked page on a
   look-alike domain and an independent review site "benign" because nothing on the page
   imitates the brand, although a brand owner may still want to know about them.
4. **We know the signals.** The hard cases were designed by looking at how the signals work,
   and the dates are set by us: look-alikes are mostly young, benign cases mostly old, so
   `new_domain` and `new_certificate` look more useful than they will be in practice.
5. **Tuning on the test set.** Any threshold chosen from these tables is tuned on the data it
   is measured on. There is no separate held-out set.
6. **Simple logos.** Logos are flat shapes in a default font. Real logos have gradients, fine
   detail and many variants, and the image model behaves differently on them.
7. **No adversaries.** Nobody tried to beat the scoring. We do not test cloaking, pages that
   block the capture browser (that outcome is only the `page: null` case), other alphabets,
   internationalised domains, right-to-left text or mobile layouts.
8. **Speed** is measured in-process on one developer PC (CPU only), without the network and
   without the page capture itself.
9. **No learning.** The scoring is a hand-written rule set on top of general-purpose models.
   These numbers measure that rule set, not a trained classifier.

What the test **is** good for: spotting regressions, comparing two settings on the same data,
and finding bugs (it already did, see the observations).

## 5. How to reproduce

From the `ai/` folder (needs the models in `ai/.models`, see `ai/README.md`):

```bash
uv run python -m eval.run                 # full run: results/latest.json + the results section below
uv run python -m eval.run --limit 10      # quick smoke run (nothing is written)
uv run python -m eval.run --only pos-norvane-clone-login,neg-login-paylark
uv run python -m eval.run --stub          # test the runner itself with a tiny stand-in analyser
uv run python -m eval.run --dump-request pos-norvane-clone-login   # one request as JSON
uv run pytest eval/tests                  # tests of the metric functions and the name-score port
uv run ruff check eval && uv run ruff format --check eval
```

A full run takes about four minutes on a CPU. `uv run pytest` on its own only runs the
service tests in `ai/tests`; the evaluation tests are run explicitly as shown.

To rebuild the dataset (only needed when the generator changes):

```bash
cd ai && uv run python -m eval.tools.build_dataset      # logos, pages, manifest
cd .. && node ai/eval/tools/render-pages.mjs            # screenshots and fixtures (installed Edge)
```

The render step uses the installed Microsoft Edge (`channel: 'msedge'`); change that one
line to use Playwright's own Chromium. The output is deterministic apart from tiny
differences in how the browser draws text.

## 6. Results

The section between the markers below is rewritten by `uv run python -m eval.run`. Do not
edit it by hand; the interpretation is in sections 7 and 8.

<!-- RESULTS:START (generated by `uv run python -m eval.run`; do not edit) -->

_Generated 2026-11-09 18:30 UTC with model version `similo-risk-1`. These numbers come from our own synthetic, fictional data and are optimistic. Do not quote them as real-world accuracy._

### Dataset used in this run

95 cases: 49 look-alikes and 46 benign pages; 83 with a captured page and 12 domain-only (`page: null`). Errors: 0.

| Category | Label | Cases | Mean score | Min-max | Flagged medium+ | Flagged high |
|---|---|---:|---:|---:|---:|---:|
| altered-logo | look-alike | 8 | 71.4 | 67-75 | 8/8 | 5/8 |
| clone-login | look-alike | 8 | 79.6 | 72-85 | 8/8 | 8/8 |
| confusable-spelling | look-alike | 8 | 69.8 | 58-75 | 8/8 | 6/8 |
| domain-only-lookalike | look-alike | 6 | 23.0 | 20-27 | 0/6 | 0/6 |
| domain-only-unrelated | benign | 6 | 14.3 | 10-20 | 0/6 | 0/6 |
| news-mention | benign | 6 | 22.7 | 6-45 | 1/6 | 0/6 |
| ocr-only | look-alike | 8 | 27.5 | 10-37 | 0/8 | 0/8 |
| other-brand-login | benign | 8 | 7.8 | 0-34 | 0/8 | 0/8 |
| parked-empty | benign | 5 | 19.6 | 0-38 | 0/5 | 0/5 |
| picture-only | look-alike | 3 | 54.3 | 51-59 | 3/3 | 0/3 |
| recoloured-landing | look-alike | 4 | 69.5 | 67-72 | 4/4 | 2/4 |
| recoloured-payment | look-alike | 4 | 61.5 | 54-65 | 4/4 | 0/4 |
| review-site | benign | 3 | 39.3 | 38-41 | 1/3 | 0/3 |
| shared-word | benign | 8 | 31.6 | 26-38 | 0/8 | 0/8 |
| unrelated-business | benign | 10 | 0.8 | 0-5 | 0/10 | 0/10 |

### Overall: look-alike if score is at or above the level threshold (medium 40, high 70)

Look-alike is the positive class. TP/FP/FN/TN are counts. AUC is the chance that a random look-alike scores higher than a random benign page (0.5 = guessing).

**Flag at `medium` (score >= 40)**

| Subset | Cases (pos/neg) | TP/FP/FN/TN | Precision | Recall | F1 | AUC |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| All cases | 95 (49/46) | 35/2/14/44 | 0.95 | 0.71 | 0.81 | 0.91 |
| Pages captured | 83 (43/40) | 35/2/8/38 | 0.95 | 0.81 | 0.88 | 0.94 |
| Domain only (no page) | 12 (6/6) | 0/0/6/6 | n/a | 0.00 | 0.00 | 0.97 |
| Pipeline-realistic (name score >= 65) | 58 (41/17) | 35/1/6/16 | 0.97 | 0.85 | 0.91 | 0.89 |

**Flag at `high` (score >= 70)**

| Subset | Cases (pos/neg) | TP/FP/FN/TN | Precision | Recall | F1 | AUC |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| All cases | 95 (49/46) | 21/0/28/46 | 1.00 | 0.43 | 0.60 | 0.91 |
| Pages captured | 83 (43/40) | 21/0/22/40 | 1.00 | 0.49 | 0.66 | 0.94 |
| Domain only (no page) | 12 (6/6) | 0/0/6/6 | n/a | 0.00 | 0.00 | 0.97 |
| Pipeline-realistic (name score >= 65) | 58 (41/17) | 21/0/20/17 | 1.00 | 0.51 | 0.68 | 0.89 |

For comparison, the Phase 5 name-only rule (flag when the name score is at least 65, no page) on all cases gives precision 0.71, recall 0.84, F1 0.77 and AUC 0.79.

### Per signal (cases with a captured page)

A signal "fires" when it earns more than 0 points. Precision/recall treat "fires" as a prediction of look-alike. AUC uses the points the signal earned.

| Signal | n | Unavail. | Fires | Precision | Recall | F1 | AUC | Mean pts look-alike | Mean pts benign |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `domain_similarity` | 83 | 0 | 51 | 0.69 | 0.81 | 0.74 | 0.79 | 17.1 | 7.9 |
| `logo_match` | 83 | 0 | 50 | 0.84 | 0.98 | 0.90 | 0.92 | 20.4 | 2.2 |
| `text_similarity` | 83 | 0 | 41 | 0.66 | 0.63 | 0.64 | 0.67 | 5.0 | 2.1 |
| `brand_mention` | 83 | 0 | 54 | 0.70 | 0.88 | 0.78 | 0.70 | 8.4 | 4.0 |
| `credential_form` | 83 | 0 | 31 | 1.00 | 0.72 | 0.84 | 0.86 | 7.2 | 0.0 |
| `payment_form` | 83 | 0 | 5 | 0.80 | 0.09 | 0.17 | 0.53 | 0.5 | 0.1 |
| `new_domain` | 83 | 0 | 38 | 0.87 | 0.77 | 0.81 | 0.84 | 1.9 | 0.2 |
| `new_certificate` | 83 | 0 | 39 | 0.85 | 0.77 | 0.80 | 0.81 | 1.8 | 0.3 |

Same signals, only pages whose name score is at least 65 (the cases the monitoring step would really send):

| Signal | n | Fires | Precision | Recall | AUC | Mean pts look-alike | Mean pts benign |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `domain_similarity` | 50 | 50 | 0.70 | 1.00 | 0.73 | 21.0 | 20.0 |
| `logo_match` | 50 | 35 | 1.00 | 1.00 | 1.00 | 23.5 | 0.0 |
| `text_similarity` | 50 | 35 | 0.77 | 0.77 | 0.68 | 6.2 | 3.3 |
| `brand_mention` | 50 | 42 | 0.74 | 0.89 | 0.54 | 8.7 | 7.3 |
| `credential_form` | 50 | 24 | 1.00 | 0.69 | 0.84 | 6.9 | 0.0 |
| `payment_form` | 50 | 4 | 1.00 | 0.11 | 0.56 | 0.6 | 0.0 |
| `new_domain` | 50 | 28 | 0.93 | 0.74 | 0.81 | 1.7 | 0.3 |
| `new_certificate` | 50 | 29 | 0.90 | 0.74 | 0.78 | 1.7 | 0.4 |

### Score distribution

| Label | n | Min | 25% | Median | 75% | Max | Mean |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| lookalike | 49 | 10 | 36 | 68 | 72 | 85 | 57.4 |
| benign | 46 | 0 | 2 | 14 | 30 | 45 | 16.5 |

| Score bucket | 0-9 | 10-19 | 20-29 | 30-39 | 40-49 | 50-59 | 60-69 | 70-79 | 80-89 | 90-100 |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| lookalike | 0 | 1 | 9 | 4 | 0 | 5 | 9 | 15 | 6 | 0 |
| benign | 18 | 8 | 6 | 12 | 2 | 0 | 0 | 0 | 0 | 0 |

### Threshold sweep (all cases)

| Flag when score >= | TP/FP/FN/TN | Precision | Recall | F1 |
| :--- | ---: | ---: | ---: | ---: |
| 10 | 49/28/0/18 | 0.64 | 1.00 | 0.78 |
| 20 | 48/20/1/26 | 0.71 | 0.98 | 0.82 |
| 30 | 39/14/10/32 | 0.74 | 0.80 | 0.76 |
| 35 | 37/8/12/38 | 0.82 | 0.76 | 0.79 |
| 40 | 35/2/14/44 | 0.95 | 0.71 | 0.81 |
| 45 | 35/1/14/45 | 0.97 | 0.71 | 0.82 |
| 50 | 35/0/14/46 | 1.00 | 0.71 | 0.83 |
| 55 | 32/0/17/46 | 1.00 | 0.65 | 0.79 |
| 60 | 30/0/19/46 | 1.00 | 0.61 | 0.76 |
| 65 | 28/0/21/46 | 1.00 | 0.57 | 0.73 |
| 70 | 21/0/28/46 | 1.00 | 0.43 | 0.60 |
| 80 | 6/0/43/46 | 1.00 | 0.12 | 0.22 |
| 90 | 0/0/49/46 | n/a | 0.00 | 0.00 |

Best F1 on this data is 0.83 at a threshold of 50 (precision 1.00, recall 0.71). A threshold tuned on the same data it is measured on is optimistic.

### What each signal adds (leave-one-out)

The score is recomputed with one signal's points removed. A big drop in AUC or F1 means the signal matters on this data. "Gated" means only pages whose name score is at least 65, which is what the monitoring step would really send.

| Scoring | AUC (pages) | F1 @ 40 (pages) | AUC (gated) | F1 @ 40 (gated) | F1 @ 70 (gated) |
| :--- | ---: | ---: | ---: | ---: | ---: |
| all signals | 0.941 | 0.88 | 1.000 | 0.99 | 0.75 |
| without `domain_similarity` | 0.972 | 0.81 | 1.000 | 0.92 | 0.00 |
| without `logo_match` | 0.914 | 0.79 | 0.930 | 0.89 | 0.00 |
| without `text_similarity` | 0.955 | 0.90 | 1.000 | 1.00 | 0.37 |
| without `brand_mention` | 0.940 | 0.90 | 1.000 | 1.00 | 0.33 |
| without `credential_form` | 0.916 | 0.88 | 1.000 | 0.99 | 0.37 |
| without `payment_form` | 0.942 | 0.88 | 1.000 | 0.99 | 0.75 |
| without `new_domain` | 0.935 | 0.88 | 1.000 | 0.99 | 0.63 |
| without `new_certificate` | 0.937 | 0.88 | 1.000 | 0.99 | 0.60 |

### What-if: other weights (approximate, not applied anywhere)

Each signal keeps the share of its maximum that it earned in this run, and the shares are re-weighted. This is a rough preview: change `ai/app/analysis/scoring.py` and run again to measure a real change. Cases with a captured page; the second block is the gated subset (name score at least 65).

**All captured pages**

| Weights | AUC | TP/FP/FN/TN @ 40 | F1 @ 40 | TP/FP/FN/TN @ 70 | F1 @ 70 | Highest benign score |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| current weights | 0.941 | 35/2/8/38 | 0.88 | 21/0/22/40 | 0.66 | 45 |
| less name weight (domain 15, logo 35) | 0.964 | 37/3/6/37 | 0.89 | 22/0/21/40 | 0.68 | 55 |
| page evidence first (domain 15, logo 35, text 10, password 15) | 0.977 | 38/3/5/37 | 0.90 | 23/0/20/40 | 0.70 | 51 |

**Gated pages**

| Weights | AUC | TP/FP/FN/TN @ 40 | F1 @ 40 | TP/FP/FN/TN @ 70 | F1 @ 70 | Highest benign score |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| current weights | 1.000 | 35/1/0/14 | 0.99 | 21/0/14/15 | 0.75 | 41 |
| less name weight (domain 15, logo 35) | 1.000 | 35/0/0/15 | 1.00 | 22/0/13/15 | 0.77 | 33 |
| page evidence first (domain 15, logo 35, text 10, password 15) | 1.000 | 35/0/0/15 | 1.00 | 23/0/12/15 | 0.79 | 29 |

### Mistakes at `medium` (score >= 40)

**False positives (benign pages flagged): 2**

| Case | Category | Score | Name score | Points by signal |
| :--- | :--- | ---: | ---: | ---: |
| `news-plumbago-launch` | news-mention | 45 | 27 | logo_match 25, text_similarity 10, brand_mention 10 |
| `review-marlowind` | review-site | 41 | 82 | domain_similarity 20, text_similarity 11, brand_mention 10 |

**False negatives (look-alikes missed): 14**

| Case | Category | Score | Name score | Points by signal |
| :--- | :--- | ---: | ---: | ---: |
| `pos-kestrelfenn-ocr-only` | ocr-only | 10 | 21 | logo_match 5, new_domain 3, new_certificate 2 |
| `dom-pos-6` | domain-only-lookalike | 20 | 82 | domain_similarity 20 |
| `dom-pos-2` | domain-only-lookalike | 21 | 86 | domain_similarity 21 |
| `dom-pos-1` | domain-only-lookalike | 22 | 91 | domain_similarity 22 |
| `pos-orbiqa-ocr-only` | ocr-only | 23 | 12 | credential_form 10, brand_mention 8, logo_match 5 |
| `pos-marlowind-ocr-only` | ocr-only | 24 | 7 | credential_form 10, brand_mention 8, new_domain 4, new_certificate 2 |
| `dom-pos-3` | domain-only-lookalike | 24 | 82 | domain_similarity 20, new_domain 4 |
| `dom-pos-5` | domain-only-lookalike | 24 | 95 | domain_similarity 23, new_domain 1 |
| `pos-tallowmere-ocr-only` | ocr-only | 27 | 24 | credential_form 10, brand_mention 8, logo_match 3, new_domain 3, new_certificate 3 |
| `dom-pos-4` | domain-only-lookalike | 27 | 95 | domain_similarity 23, new_domain 4 |
| `pos-zephyrio-ocr-only` | ocr-only | 30 | 24 | credential_form 10, brand_mention 8, logo_match 7, new_domain 3, new_certificate 2 |
| `pos-lumenhaven-ocr-only` | ocr-only | 33 | 31 | credential_form 10, logo_match 9, brand_mention 8, new_domain 3, new_certificate 3 |
| `pos-plumbagopay-ocr-only` | ocr-only | 36 | 21 | logo_match 11, credential_form 10, brand_mention 8, new_certificate 4, new_domain 3 |
| `pos-norvane-ocr-only` | ocr-only | 37 | 15 | logo_match 13, credential_form 10, brand_mention 8, new_domain 4, new_certificate 2 |

### Mistakes at `high` (score >= 70)

**False positives (benign pages flagged): 0**

None.

**False negatives (look-alikes missed): 28**

| Case | Category | Score | Name score | Points by signal |
| :--- | :--- | ---: | ---: | ---: |
| `pos-kestrelfenn-ocr-only` | ocr-only | 10 | 21 | logo_match 5, new_domain 3, new_certificate 2 |
| `dom-pos-6` | domain-only-lookalike | 20 | 82 | domain_similarity 20 |
| `dom-pos-2` | domain-only-lookalike | 21 | 86 | domain_similarity 21 |
| `dom-pos-1` | domain-only-lookalike | 22 | 91 | domain_similarity 22 |
| `pos-orbiqa-ocr-only` | ocr-only | 23 | 12 | credential_form 10, brand_mention 8, logo_match 5 |
| `pos-marlowind-ocr-only` | ocr-only | 24 | 7 | credential_form 10, brand_mention 8, new_domain 4, new_certificate 2 |
| `dom-pos-3` | domain-only-lookalike | 24 | 82 | domain_similarity 20, new_domain 4 |
| `dom-pos-5` | domain-only-lookalike | 24 | 95 | domain_similarity 23, new_domain 1 |
| `pos-tallowmere-ocr-only` | ocr-only | 27 | 24 | credential_form 10, brand_mention 8, logo_match 3, new_domain 3, new_certificate 3 |
| `dom-pos-4` | domain-only-lookalike | 27 | 95 | domain_similarity 23, new_domain 4 |
| `pos-zephyrio-ocr-only` | ocr-only | 30 | 24 | credential_form 10, brand_mention 8, logo_match 7, new_domain 3, new_certificate 2 |
| `pos-lumenhaven-ocr-only` | ocr-only | 33 | 31 | credential_form 10, logo_match 9, brand_mention 8, new_domain 3, new_certificate 3 |
| `pos-plumbagopay-ocr-only` | ocr-only | 36 | 21 | logo_match 11, credential_form 10, brand_mention 8, new_certificate 4, new_domain 3 |
| `pos-norvane-ocr-only` | ocr-only | 37 | 15 | logo_match 13, credential_form 10, brand_mention 8, new_domain 4, new_certificate 2 |
| `pos-marlowind-picture-only` | picture-only | 51 | 82 | domain_similarity 20, logo_match 20, brand_mention 8, new_domain 2, new_certificate 1 |
| `pos-tallowmere-picture-only` | picture-only | 53 | 82 | domain_similarity 20, logo_match 20, brand_mention 8, new_domain 3, new_certificate 2 |
| `pos-kestrelfenn-recoloured-payment` | recoloured-payment | 54 | 82 | logo_match 24, domain_similarity 20, payment_form 5, text_similarity 3, new_domain 1, new_certificate 1 |
| `pos-kestrelfenn-confusable` | confusable-spelling | 58 | 91 | logo_match 24, domain_similarity 22, credential_form 10, new_domain 1, new_certificate 1 |
| `pos-norvane-picture-only` | picture-only | 59 | 82 | logo_match 24, domain_similarity 20, brand_mention 8, new_domain 4, new_certificate 3 |
| `pos-tallowmere-recoloured-payment` | recoloured-payment | 63 | 82 | logo_match 24, domain_similarity 20, brand_mention 10, payment_form 5, text_similarity 2, new_certificate 2 |
| `pos-lumenhaven-recoloured-payment` | recoloured-payment | 64 | 82 | domain_similarity 20, logo_match 20, brand_mention 10, text_similarity 5, payment_form 5, new_domain 2, new_certificate 2 |
| `pos-norvane-recoloured-payment` | recoloured-payment | 65 | 82 | logo_match 24, domain_similarity 20, brand_mention 10, text_similarity 6, payment_form 5 |
| `pos-kestrelfenn-altered-logo` | altered-logo | 67 | 91 | logo_match 24, domain_similarity 22, credential_form 10, text_similarity 6, new_domain 3, new_certificate 2 |
| `pos-marlowind-recoloured-landing` | recoloured-landing | 67 | 82 | logo_match 24, domain_similarity 20, text_similarity 11, brand_mention 10, new_domain 1, new_certificate 1 |
| `pos-plumbagopay-confusable` | confusable-spelling | 68 | 91 | logo_match 23, domain_similarity 22, brand_mention 10, credential_form 10, new_certificate 2, new_domain 1 |

(first 25 of 28 shown; all are in `ai/eval/results/latest.json`)

### Speed (this PC, CPU only)

| Case type (ms) | Mean | Median | 95th percentile | Max |
| :--- | ---: | ---: | ---: | ---: |
| First call (loads models) | 3634 |  |  |  |
| Page captured | 2291 | 2481 | 3032 | 3446 |
| Domain only | 1 | 1 | 1 | 1 |
| All warm calls | 1999 | 2063 | 2999 | 3446 |

Times are for one analysis in-process on the developer PC, without the network and without the page capture itself.

### Weights and thresholds used

Weights: `domain_similarity` 25, `logo_match` 25, `text_similarity` 15, `brand_mention` 10, `credential_form` 10, `payment_form` 5, `new_domain` 5, `new_certificate` 5.

Thresholds: `level_high` 70, `level_medium` 40, `domain_min_value` 0.4, `phash_near_identical_distance` 8, `phash_fraction_at_limit` 0.9, `clip_low` 0.82, `clip_high` 0.95, `clip_max_fraction` 0.8, `skip_clip_when_fraction_at_least` 0.9, `tile_band_fraction` 0.2, `max_tiles` 24, `logo_very_similar_fraction` 0.55, `text_low` 0.5, `text_high` 0.85, `mention_title` 1.0, `mention_image` 0.8, `mention_text_lookalike` 0.8, `mention_text_exact` 0.5, `mention_text_exact_repeated` 0.8, `mention_repeat_count` 3, `new_domain_days` 30, `new_certificate_days` 14, `gate_domain_value` 0.7, `gate_logo_fraction` 0.3, `gate_text_fraction` 0.3, `gate_mention_fraction` 0.5.

<!-- RESULTS:END -->

## 7. Observations

The saved run above analysed all 95 cases without errors. Treat these as observations about this
fictional set only:

- At the `medium` threshold (40), the score flagged 35 of 49 look-alikes and 2 of 46 benign
  cases (precision 0.946, recall 0.714, F1 0.814). The two false positives are an article that
  uses a brand logo and an independent comparison site with a similar domain.
- At `high` (70), it flagged 21 look-alikes and no benign cases, but missed 28 of 49
  look-alikes (recall 0.429). A high score is conservative on this set; a lower score must not
  be read as proof that a domain is safe.
- In the selected captured-page subset with a name score of at least 65, the medium threshold
  flagged all 35 look-alikes and 1 of 15 benign cases. This subset is selected by the existing
  name-score gate and contains only 50 synthetic cases, so its perfect recall is not a
  production estimate.
- All eight `ocr-only` and all six `domain-only-lookalike` cases fall below `medium`. A
  domain-only request has no page evidence and can earn at most 30 points under the current
  weights, so it cannot reach 40 by construction. The domain-only score still ranks these
  fixtures well (AUC 0.972), but the current severity threshold cannot surface them as medium.
- On captured pages, logo match (AUC 0.922) and credential-form detection (0.860) separated
  labels best among individual signals. Payment-form detection was near chance (AUC 0.534),
  while text similarity (0.674) and brand mention (0.695) also had limited separation. These
  scores reflect the small, authored examples and their current thresholds.

## 8. Recommended changes

1. **Keep the current weights and thresholds as a regression baseline.** Do not tune them from
   this same synthetic set. The false-positive and false-negative examples are useful for
   spotting regressions, but not for choosing production operating points.
2. **Collect a realistic, independently labelled evaluation set.** Include more brands,
   unrelated pages that share names, editorial and review pages, varied languages and layouts,
   and screenshots from real capture conditions. Keep it separate from any data used to adjust
   signals or thresholds; where possible, split by brand and page template to reduce leakage.
3. **Keep uncaptured/domain-only candidates visible as review leads.** Their score ceiling is
   below `medium`; do not make the low score imply that capture failure or domain evidence means
   low risk. Decide on a separate review state or queue for these cases before relying on the
   score alone.
4. **Investigate the OCR-only misses and editorial false positives with new labelled examples.**
   Check image text extraction and capture quality for the former, and how the product should
   distinguish brand use in commentary from impersonation for the latter. Change a signal only
   after a separate evaluation set can measure the trade-off.
