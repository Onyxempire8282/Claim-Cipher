"""
parse_estimate.py
===================

This module contains functions for extracting vehicle and claim data from
CCC ONE estimate PDFs.  The existing ``parse.py`` in this repository
demonstrated how to use ``pdfplumber`` and regular expressions to pull
very specific fields from two pages of a sample estimate.  In order
to support a wider variety of estimate layouts and make the workflow
more flexible, this module generalises the parsing logic:

* It reads *all* pages of the provided PDF (or a user‑specified range)
  rather than stopping after page 2.  This makes it more likely that
  important fields will be captured even if they appear later in the
  document.
* It searches for generic patterns (``VIN``, a four‑digit year,
  ``Make``, ``Model``, mileage and damages descriptions) using
  case‑insensitive regular expressions.  Missing values are left as
  ``None`` so the user can fill them in manually later.
* It exposes helper functions like :func:`extract_vehicle_info`
  independently so they can be reused by other scripts (for example,
  you could call these functions from a Flask route or during an
  automated batch process).

The module also contains a ``__main__`` section so it can be executed
as a command‑line script.  When run directly it will parse the
specified estimate PDF and write the results to ``output/parsed_data.json``.
Comments throughout the code explain what each section does.  If you
need to extend the parsing logic (for example to capture additional
fields or handle alternate layouts) this is the place to do it.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Dict, Optional

import pdfplumber  # type: ignore


def read_pdf_text(pdf_path: Path, max_pages: Optional[int] = None) -> str:
    """Extracts text from a PDF using ``pdfplumber``.

    Args:
        pdf_path: The path to the PDF file.
        max_pages: Optional maximum number of pages to read.  If
            ``None`` (default) the entire document is processed.

    Returns:
        A single string containing the concatenated text of all pages.

    Note:
        ``pdfplumber`` returns each page as a separate object.  If
        ``extract_text`` fails to return anything for a page the
        extracted text is skipped.
    """
    text = ""
    with pdfplumber.open(str(pdf_path)) as pdf:
        for idx, page in enumerate(pdf.pages):
            if max_pages is not None and idx >= max_pages:
                break
            page_text = page.extract_text()
            if page_text:
                # Normalize newlines to aid pattern matching
                text += page_text + "\n"
    return text


def extract_vehicle_info(text: str) -> Dict[str, Optional[str]]:
    """Pulls out common vehicle information from the estimate text.

    The CCC ONE estimate format can vary significantly between carriers
    and versions.  This function uses conservative regular expressions
    to locate likely fields.  If a pattern does not match, the
    corresponding value will be ``None``.  You can adjust or extend
    these patterns to fit your own documents.

    Patterns searched:

    * **VIN** – any 17‑character alphanumeric string (excluding I, O, Q).
    * **Year** – four consecutive digits between 1900 and 2099.
    * **Make** – the word following ``Make`` or ``MAKE``.
    * **Model** – the word(s) following ``Model`` or ``MODEL``.
    * **Mileage** – numbers following ``Miles`` or ``Mileage``.
    * **Damages** – up to 200 characters following ``Damages`` or
      ``Damage Description``.

    Args:
        text: Raw text extracted from the PDF.

    Returns:
        A dictionary with keys ``vin``, ``year``, ``make``, ``model``,
        ``mileage`` and ``damages``.  Missing values remain ``None``.
    """
    info: Dict[str, Optional[str]] = {
        "vin": None,
        "year": None,
        "make": None,
        "model": None,
        "mileage": None,
        "damages": None,
    }
    # 17‑character VIN (letters/digits except I,O,Q)
    vin_match = re.search(r"\b([A-HJ-NPR-Z0-9]{17})\b", text)
    if vin_match:
        info["vin"] = vin_match.group(1)
    # Year (1900–2099)
    year_match = re.search(r"\b(19|20)\d{2}\b", text)
    if year_match:
        info["year"] = year_match.group(0)
    # Make – look for 'Make' followed by a colon/dash and a word
    make_match = re.search(r"Make\s*[:\-]?\s*([A-Za-z]+)", text, re.IGNORECASE)
    if make_match:
        info["make"] = make_match.group(1)
    # Model – look for 'Model' followed by word(s) until newline or comma
    model_match = re.search(r"Model\s*[:\-]?\s*([A-Za-z0-9\- ]+)", text, re.IGNORECASE)
    if model_match:
        info["model"] = model_match.group(1).strip()
    # Mileage – look for 'Miles' or 'Mileage' followed by digits/commas
    mileage_match = re.search(r"(?:Miles|Mileage)\s*[:\-]?\s*([\d,]+)", text, re.IGNORECASE)
    if mileage_match:
        info["mileage"] = mileage_match.group(1).replace(",", "")
    # Damages – capture up to 200 characters after the heading
    damage_match = re.search(
        r"(?:Damages?|Damage Description)\s*[:\-]?\s*([\s\S]{0,200})",
        text,
        re.IGNORECASE,
    )
    if damage_match:
        info["damages"] = damage_match.group(1).strip()
    return info


def parse_estimate(pdf_path: Path, max_pages: Optional[int] = None) -> Dict[str, Optional[str]]:
    """Convenience wrapper to read and extract vehicle info from a PDF.

    Args:
        pdf_path: Path to the estimate PDF.
        max_pages: Optional limit for pages to read.  See :func:`read_pdf_text`.

    Returns:
        A dictionary of parsed fields.  Missing keys may be ``None``.
    """
    text = read_pdf_text(pdf_path, max_pages=max_pages)
    return extract_vehicle_info(text)


def save_parsed_data(data: Dict[str, Optional[str]], output_path: Path) -> None:
    """Writes the parsed data to a JSON file in a human‑readable format.

    Args:
        data: The dictionary returned by :func:`parse_estimate`.
        output_path: Path to the output JSON file.
    """
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def main() -> None:
    """Command‑line entry point.

    Usage::

        python parse_estimate.py input/estimate.pdf

    When invoked directly this function will parse the provided PDF
    and write ``output/parsed_data.json``.  You can optionally specify
    the number of pages to read by setting the environment variable
    ``MAX_PAGES`` to an integer value.
    """
    import os
    import sys

    if len(sys.argv) < 2:
        print("Usage: python parse_estimate.py <path to estimate.pdf>")
        sys.exit(1)
    pdf_path = Path(sys.argv[1])
    if not pdf_path.is_file():
        print(f"File not found: {pdf_path}")
        sys.exit(1)
    max_pages_env = os.getenv("MAX_PAGES")
    max_pages = int(max_pages_env) if max_pages_env and max_pages_env.isdigit() else None
    parsed = parse_estimate(pdf_path, max_pages=max_pages)
    # Ensure output directory exists
    output_dir = Path("output")
    output_dir.mkdir(parents=True, exist_ok=True)
    save_parsed_data(parsed, output_dir / "parsed_data.json")
    print("✅ Parsed data saved to", output_dir / "parsed_data.json")
    print(json.dumps(parsed, indent=2))


if __name__ == "__main__":
    main()