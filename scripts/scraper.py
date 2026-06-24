#!/usr/bin/env python3
"""
Office des Changes (OC) Daily Regulation Scraper
-------------------------------------------------
Scrapes the Office des Changes website for new regulatory documents
(circulaires, instructions, communiqués, notes de service).

Usage:
    python scraper.py              # Normal daily run
    python scraper.py --force      # Re-process all documents
    python scraper.py --test       # Dry run, prints without saving

Cron example (run daily at 07:00):
    0 7 * * * /path/to/venv/bin/python /path/to/scripts/scraper.py >> /var/log/oc_scraper.log 2>&1
"""

import os
import sys
import json
import time
import hashlib
import logging
import argparse
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("oc_scraper")

# ─── Constants ────────────────────────────────────────────────────────────────

OC_BASE = "https://www.oc.gov.ma"

# Pages to monitor for new regulatory documents
PAGES = {
    "circulaires":   "/fr/circulaires",
    "instructions":  "/fr/instructions",
    "communiques":   "/fr/communiques-de-presse",
    "notes":         "/fr/notes-de-service",
    "textes":        "/fr/textes-reglementaires",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; KhouyaFX-Bot/1.0; "
        "+https://khouyafx.ma/bot)"
    ),
    "Accept-Language": "fr-FR,fr;q=0.9,ar;q=0.8,en;q=0.5",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# Data paths (relative to this script's directory)
_HERE = Path(__file__).parent
DATA_DIR   = _HERE / "data"
SEEN_FILE  = DATA_DIR / "seen_docs.json"
DB_FILE    = DATA_DIR / "docs_database.json"
PDFS_DIR   = DATA_DIR / "pdfs"
LOG_FILE   = DATA_DIR / "scraper.log"

# ─── Helpers ──────────────────────────────────────────────────────────────────

def ensure_dirs():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PDFS_DIR.mkdir(parents=True, exist_ok=True)
    # Add file handler to logger once data dir exists
    if not any(isinstance(h, logging.FileHandler) for h in log.handlers):
        fh = logging.FileHandler(LOG_FILE, encoding="utf-8")
        fh.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
        log.addHandler(fh)


def url_id(url: str) -> str:
    """Stable 12-char ID from a URL."""
    return hashlib.sha256(url.encode()).hexdigest()[:12]


def load_json(path: Path, default):
    if path.exists():
        try:
            with open(path, encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            log.warning("Corrupt JSON at %s — starting fresh.", path)
    return default


def save_json(path: Path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ─── HTTP ─────────────────────────────────────────────────────────────────────

def fetch(url: str, retries: int = 4, stream: bool = False):
    """GET with exponential-backoff retries."""
    delay = 2
    for attempt in range(retries):
        try:
            resp = requests.get(
                url, headers=HEADERS, timeout=30, stream=stream
            )
            resp.raise_for_status()
            return resp
        except requests.RequestException as exc:
            log.warning("Attempt %d/%d failed for %s: %s", attempt + 1, retries, url, exc)
            if attempt < retries - 1:
                time.sleep(delay)
                delay *= 2
    log.error("All retries exhausted for %s", url)
    return None


# ─── Link Extraction ──────────────────────────────────────────────────────────

def extract_links(html: str, base_url: str, doc_type: str) -> list[dict]:
    """Parse HTML and extract candidate regulatory document links."""
    soup = BeautifulSoup(html, "html.parser")
    docs = []
    seen_hrefs: set[str] = set()

    for tag in soup.find_all("a", href=True):
        href: str = tag["href"].strip()
        title: str = tag.get_text(separator=" ", strip=True)

        # Skip empty, navigation, and anchor links
        if not title or len(title) < 6 or href.startswith("#") or href.startswith("mailto:"):
            continue

        # Build absolute URL
        abs_url = urljoin(base_url, href)

        # Deduplicate
        if abs_url in seen_hrefs:
            continue
        seen_hrefs.add(abs_url)

        parsed = urlparse(abs_url)

        # Only follow links on OC domain
        if OC_BASE not in abs_url and "office-des-changes" not in abs_url:
            continue

        is_pdf = parsed.path.lower().endswith(".pdf")

        # Filter: PDF doc or a page whose path suggests regulation content
        regulatory_path_kws = {
            "circulaire", "instruction", "communique", "note", "texte",
            "download", "telecharger", "document", "publication",
        }
        path_lower = parsed.path.lower()
        looks_regulatory = is_pdf or any(kw in path_lower for kw in regulatory_path_kws)

        # Also include links with regulatory keywords in the title
        title_lower = title.lower()
        regulatory_title_kws = {
            "circulaire", "instruction", "communiqué", "note de service",
            "décision", "arrêté", "ordonnance", "loi", "dahir",
        }
        title_has_kw = any(kw in title_lower for kw in regulatory_title_kws)

        if looks_regulatory or title_has_kw:
            docs.append({
                "url":    abs_url,
                "title":  title[:200],
                "type":   doc_type.upper(),
                "is_pdf": is_pdf,
            })

    return docs


# ─── PDF Processing ───────────────────────────────────────────────────────────

def download_pdf(url: str, doc_id: str, title: str) -> Path | None:
    """Download a PDF, return local path or None on failure."""
    safe_title = "".join(c if c.isalnum() or c in "-_ " else "_" for c in title[:40])
    filename = f"{doc_id}_{safe_title}.pdf"
    dest = PDFS_DIR / filename

    if dest.exists():
        log.info("PDF already cached: %s", filename)
        return dest

    log.info("Downloading PDF: %s", url)
    resp = fetch(url, stream=True)
    if not resp:
        return None

    content_type = resp.headers.get("Content-Type", "")
    if "pdf" not in content_type and not url.lower().endswith(".pdf"):
        log.warning("Unexpected Content-Type '%s' for %s — skipping download.", content_type, url)
        return None

    with open(dest, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)

    log.info("Saved PDF: %s (%.1f KB)", filename, dest.stat().st_size / 1024)
    return dest


def extract_pdf_text(path: Path) -> str | None:
    """Extract plain text from a PDF using pdfminer.six."""
    try:
        from pdfminer.high_level import extract_text  # type: ignore

        text = extract_text(str(path))
        text = text.strip()
        # Truncate very long documents (keep first ~10 000 chars for RAG)
        if len(text) > 10_000:
            text = text[:10_000] + "\n[… truncated for RAG indexing …]"
        return text if text else None
    except ImportError:
        log.warning(
            "pdfminer.six not installed. Run: pip install pdfminer.six\n"
            "PDF text extraction disabled."
        )
        return None
    except Exception as exc:
        log.error("PDF extraction failed for %s: %s", path.name, exc)
        return None


# ─── Page-level HTML content extraction (for non-PDF docs) ───────────────────

def extract_page_text(url: str) -> str | None:
    """Fetch a webpage and extract main content text."""
    resp = fetch(url)
    if not resp:
        return None
    soup = BeautifulSoup(resp.text, "html.parser")

    # Remove boilerplate
    for tag in soup(["script", "style", "nav", "header", "footer", "aside"]):
        tag.decompose()

    # Try common content containers
    for selector in [".field-body", ".view-content", "article", "main", ".content"]:
        node = soup.select_one(selector)
        if node:
            text = node.get_text(separator="\n", strip=True)
            if len(text) > 100:
                return text[:8000]

    return soup.get_text(separator="\n", strip=True)[:8000]


# ─── Core Scraper ─────────────────────────────────────────────────────────────

def scrape_all_pages() -> list[dict]:
    """Fetch all configured pages and return deduplicated candidate doc list."""
    all_docs: list[dict] = []
    seen_urls: set[str] = set()

    for page_type, path in PAGES.items():
        page_url = OC_BASE + path
        log.info("Scraping %s → %s", page_type, page_url)

        resp = fetch(page_url)
        if not resp:
            log.warning("Could not fetch page: %s", page_url)
            continue

        docs = extract_links(resp.text, page_url, page_type)
        log.info("  Found %d candidate links", len(docs))

        for doc in docs:
            if doc["url"] not in seen_urls:
                seen_urls.add(doc["url"])
                all_docs.append(doc)

        time.sleep(1.0)  # polite crawl delay

    return all_docs


def process_document(doc: dict) -> dict:
    """Download and extract content for a single document."""
    doc_id = url_id(doc["url"])
    record = {
        "id":           doc_id,
        "title":        doc["title"],
        "type":         doc["type"],
        "url":          doc["url"],
        "is_pdf":       doc["is_pdf"],
        "date_scraped": datetime.now().isoformat(),
        "content":      None,
        "pdf_path":     None,
        "is_new":       True,
    }

    if doc["is_pdf"]:
        pdf_path = download_pdf(doc["url"], doc_id, doc["title"])
        if pdf_path:
            record["pdf_path"] = str(pdf_path.relative_to(_HERE))
            record["content"]  = extract_pdf_text(pdf_path)
    else:
        record["content"] = extract_page_text(doc["url"])

    return record


# ─── Main Entry Point ─────────────────────────────────────────────────────────

def run(force: bool = False, dry_run: bool = False) -> list[dict]:
    ensure_dirs()

    log.info("=" * 60)
    log.info("Office des Changes Scraper — %s", datetime.now().strftime("%Y-%m-%d %H:%M"))
    log.info("=" * 60)

    seen_urls: set[str] = set(load_json(SEEN_FILE, []))
    existing_db: list[dict] = load_json(DB_FILE, [])
    existing_ids: set[str] = {d["id"] for d in existing_db}

    # 1. Scrape all pages
    candidates = scrape_all_pages()
    log.info("Total candidate links found: %d", len(candidates))

    # 2. Identify new documents
    new_records: list[dict] = []
    for doc in candidates:
        if doc["url"] in seen_urls and not force:
            continue

        log.info("[NEW] [%s] %s", doc["type"], doc["title"][:80])

        if dry_run:
            record = {
                "id":    url_id(doc["url"]),
                "title": doc["title"],
                "type":  doc["type"],
                "url":   doc["url"],
            }
        else:
            record = process_document(doc)

        if record["id"] not in existing_ids:
            new_records.append(record)
            existing_db.append(record)
            existing_ids.add(record["id"])

        seen_urls.add(doc["url"])

    # 3. Persist state
    if not dry_run:
        save_json(SEEN_FILE, list(seen_urls))
        save_json(DB_FILE, existing_db)

    # 4. Summary
    log.info("-" * 60)
    log.info("New documents found this run: %d", len(new_records))
    log.info("Total documents in database:  %d", len(existing_db))

    if new_records:
        log.info("\n🔔 NEW REGULATIONS DETECTED:")
        for r in new_records:
            log.info("  [%s] %s", r["type"], r["title"])

        # Emit structured JSON to stdout for downstream integration
        output = {
            "scraped_at":    datetime.now().isoformat(),
            "new_count":     len(new_records),
            "new_documents": [
                {k: v for k, v in r.items() if k != "content"}
                for r in new_records
            ],
        }
        print(json.dumps(output, ensure_ascii=False, indent=2))
    else:
        log.info("No new regulations since last run.")

    return new_records


# ─── CLI ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="KhouyaFX — Office des Changes daily scraper"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-process all previously seen documents.",
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Dry run: scan and print without downloading or saving.",
    )
    args = parser.parse_args()

    new_docs = run(force=args.force, dry_run=args.test)
    sys.exit(0)
