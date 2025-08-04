"""
process_claim.py
================

This script orchestrates the full total‑loss workflow from the command
line.  It combines the modules provided in this repository to parse a
CCC ONE estimate, decode the VIN, compute a placeholder NADA value,
generate example salvage bids, fill out the BCIF PDF and produce a
claim summary.

When run as a script the typical usage is::

    python process_claim.py --estimate input/estimate.pdf --bcif input/CCC\ BCIF.pdf \
        --customer "John Doe" --adjuster "Jane Smith" --claim-number 12345 \
        --date-of-loss 2025-01-15 --location "123 Main St" --days-to-repair 10

If any of these fields are omitted they will remain blank in the BCIF
and summary; you can edit them later.  The summary is saved to
``output/claim_summary.txt`` by default and the filled BCIF is written to
``output/filled_bcif.pdf``.  See the README for more details.

Note:

* This script uses only built‑in libraries plus the modules in
  ``scripts/``.  Optional dependencies such as ``reportlab`` or
  ``fpdf`` are **not** imported here; instead, we call the stub
  implementation in :mod:`summary_utils`.  You should update that
  function if you want to produce a real PDF.
* The BCIF filling uses ``pdfrw`` exactly as in ``fill_bcif.py``.  You
  will need to install the ``pdfrw`` package (``pip install pdfrw``)
  for this portion to work.
* Error handling is minimal.  For production use you should add
  additional checks and logging.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Dict, Optional

from pdfrw import PdfReader, PdfWriter, PdfDict  # type: ignore

from . import parse_estimate
from . import vin_utils
from . import salvage_utils
from . import summary_utils


def fill_bcif(template_path: Path, data: Dict[str, str], output_path: Path) -> None:
    """Fills a CCC BCIF PDF form using ``pdfrw``.

    This function is a slightly modified version of the existing
    ``fill_bcif.py`` script.  It loads the parsed data, iterates over
    the form fields in the template and writes matching values.  If
    ``data`` contains a key that matches the field name in the PDF, the
    corresponding annotation's value is set.  Field names in the PDF
    template can be discovered by printing them (see the original
    ``fill_bcif.py`` for details).

    Args:
        template_path: Path to the blank BCIF PDF.
        data: A dictionary mapping field names to values.
        output_path: Destination path for the filled PDF.
    """
    template_pdf = PdfReader(str(template_path))
    for page in template_pdf.pages:
        annots = page.Annots
        if not annots:
            continue
        for annot in annots:
            if annot.Subtype == '/Widget' and annot.T:
                key = annot.T[1:-1]  # Remove parentheses around field name
                if key in data and data[key] is not None:
                    annot.V = data[key]
                    # Set appearance dictionary to avoid showing stale values
                    annot.AP = PdfDict()
    PdfWriter().write(str(output_path), template_pdf)


def compute_nada_value(year: Optional[str]) -> Optional[int]:
    """Computes a placeholder NADA value based on vehicle year.

    This mirrors the depreciation formula used in the front‑end
    JavaScript: starting at $30,000 for the current model year and
    depreciating 7 percent per year.  If ``year`` is invalid or in
    the future the function returns ``None``.
    """
    try:
        year_int = int(year) if year else None
    except (TypeError, ValueError):
        return None
    from datetime import datetime
    current_year = datetime.now().year
    if not year_int or year_int > current_year or year_int < 1900:
        return None
    age = current_year - year_int
    base = 30000
    value = base * (0.93 ** age)
    return int(round(value))


def assemble_data(args: argparse.Namespace, parsed: Dict[str, Optional[str]], decoded: Dict[str, str]) -> Dict[str, str]:
    """Combines command‑line arguments, parsed estimate data and decoded VIN.

    Preference order for each field:

    1. Command‑line argument (explicitly provided by the user).
    2. Decoded VIN information (year, make, model) where available.
    3. Parsed estimate data from the PDF.
    4. ``None`` if nothing is available.

    The resulting dictionary is suitable for filling the BCIF and
    building the summary.
    """
    result: Dict[str, Optional[str]] = {}
    # Claim/party information
    result['customer_name'] = args.customer_name or None
    result['adjuster_name'] = args.adjuster_name or None
    result['claim_number'] = args.claim_number or None
    result['date_of_loss'] = args.date_of_loss or None
    result['inspection_location'] = args.location or None
    # Vehicle fields: prefer user input -> VIN decode -> parsed
    result['vin'] = args.vin or parsed.get('vin') or None
    result['year'] = args.year or decoded.get('ModelYear') or parsed.get('year') or None
    result['make'] = args.make or decoded.get('Make') or parsed.get('make') or None
    result['model'] = args.model or decoded.get('Model') or parsed.get('model') or None
    result['mileage'] = args.mileage or parsed.get('mileage') or None
    result['damages'] = args.damages or parsed.get('damages') or None
    result['days_to_repair'] = args.days_to_repair or None
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="Process a CCC estimate and generate claim documents")
    parser.add_argument("--estimate", required=True, help="Path to the CCC ONE estimate PDF")
    parser.add_argument("--bcif", default="input/CCC BCIF.pdf", help="Path to the blank BCIF PDF template")
    parser.add_argument("--customer-name", help="Customer name")
    parser.add_argument("--adjuster-name", help="Adjuster name")
    parser.add_argument("--claim-number", help="Claim number")
    parser.add_argument("--date-of-loss", help="Date of loss (YYYY-MM-DD)")
    parser.add_argument("--location", help="Inspection location")
    parser.add_argument("--vin", help="VIN (overrides parsed VIN)")
    parser.add_argument("--year", help="Vehicle year (overrides parsed/decoded year)")
    parser.add_argument("--make", help="Vehicle make (overrides parsed/decoded make)")
    parser.add_argument("--model", help="Vehicle model (overrides parsed/decoded model)")
    parser.add_argument("--mileage", help="Vehicle mileage (overrides parsed mileage)")
    parser.add_argument("--damages", help="Damage description (overrides parsed damages)")
    parser.add_argument("--days-to-repair", help="Estimated days to repair")
    parser.add_argument("--total-loss", action="store_true", help="Mark the vehicle as a total loss; omit to mark as repairable")
    parser.add_argument("--output-dir", default="output", help="Directory where outputs should be saved")
    args = parser.parse_args()

    estimate_path = Path(args.estimate)
    bcif_path = Path(args.bcif)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Parse estimate PDF
    parsed = parse_estimate.parse_estimate(estimate_path)
    print("Parsed data:", parsed)

    # 2. Decode VIN (if available)
    decoded: Dict[str, str] = {}
    vin_from_data = args.vin or parsed.get('vin')
    if vin_from_data:
        decoded_full = vin_utils.decode_vin(vin_from_data)
        if decoded_full:
            decoded = decoded_full
            print("VIN decoded:", vin_utils.extract_basic_attributes(decoded))
        else:
            print("VIN decoding failed or returned no data")

    # 3. Merge data from all sources
    assembled = assemble_data(args, parsed, decoded)

    # 4. Compute NADA value
    nada_value = compute_nada_value(assembled.get('year'))
    print("Estimated NADA value:", nada_value)

    # 5. Generate salvage bids (example only)
    salvage_bids = salvage_utils.generate_example_bids(nada_value) if nada_value else []
    print("Salvage bids:", salvage_bids)

    # 6. Fill BCIF PDF
    bcif_output = output_dir / "filled_bcif.pdf"
    # Use only keys expected by the BCIF; unknown keys will be ignored
    fill_bcif(bcif_path, assembled, bcif_output)
    print("Filled BCIF saved to", bcif_output)

    # 7. Build claim summary
    claim_summary = summary_utils.build_summary_text(
        claim_data={
            'claim_number': assembled.get('claim_number'),
            'customer_name': assembled.get('customer_name'),
            'adjuster_name': assembled.get('adjuster_name'),
            'date_of_loss': assembled.get('date_of_loss'),
            'inspection_location': assembled.get('inspection_location'),
        },
        vehicle_info={
            'year': assembled.get('year'),
            'make': assembled.get('make'),
            'model': assembled.get('model'),
            'vin': assembled.get('vin'),
            'mileage': assembled.get('mileage'),
            'damages': assembled.get('damages'),
            'days_to_repair': assembled.get('days_to_repair'),
        },
        nada_value=nada_value,
        salvage_bids=salvage_bids,
        is_total_loss=args.total_loss,
    )

    # 8. Save summary (txt for now; see summary_utils for PDF stub)
    summary_path = output_dir / "claim_summary"
    summary_utils.generate_summary_pdf(claim_summary, summary_path)
    print("Claim summary saved to", summary_path.with_suffix('.txt'))

    # Also write a JSON version of assembled data for inspection
    with (output_dir / "assembled_data.json").open('w', encoding='utf-8') as f:
        json.dump(assembled, f, indent=2)


if __name__ == "__main__":
    main()