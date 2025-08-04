"""
summary_utils.py
================

Functions for building and exporting a claim summary document.  The
summary consolidates information from the parsed estimate, VIN
decoding, salvage bids and user input (e.g. claim numbers and names).

Key features provided:

* :func:`build_summary_text` – Produces a multi‑line string summarising
  the claim.  This plain‑text format is useful when pasting into a
  claims management system that does not accept PDFs.
* :func:`generate_summary_pdf` – Writes the summary to a PDF file.
  This function deliberately leaves a placeholder for using a PDF
  library such as `reportlab` or `fpdf`.  You can plug in your
  preferred library by following the instructions in the comments.

By centralising these operations in a utility module you avoid
duplicating logic across multiple scripts.
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional


def build_summary_text(
    claim_data: Dict[str, str],
    vehicle_info: Dict[str, str],
    nada_value: Optional[int],
    salvage_bids: List[Dict[str, int]],
    is_total_loss: bool,
) -> str:
    """Constructs a human‑readable claim summary.

    Args:
        claim_data: Basic claim information (customer name, adjuster
            name, claim number, date of loss, inspection location).
        vehicle_info: Parsed and/or decoded vehicle fields (year,
            make, model, VIN, mileage, damages, days to repair).
        nada_value: Estimated NADA value of the vehicle, or None if
            unavailable.
        salvage_bids: A list of dictionaries with vendor names and bid
            amounts.  Empty if no bids are available.
        is_total_loss: Whether the vehicle is being treated as a total
            loss (True) or repairable (False).

    Returns:
        A formatted string containing all the provided information.
    """
    lines = []
    lines.append(f"Claim Number: {claim_data.get('claim_number', 'N/A')}")
    lines.append(f"Customer Name: {claim_data.get('customer_name', 'N/A')}")
    lines.append(f"Adjuster Name: {claim_data.get('adjuster_name', 'N/A')}")
    dol = claim_data.get('date_of_loss', 'N/A')
    loc = claim_data.get('inspection_location', 'N/A')
    lines.append(f"Date of Loss: {dol} | Inspection Location: {loc}")
    year = vehicle_info.get('year', 'N/A')
    make = vehicle_info.get('make', 'N/A')
    model = vehicle_info.get('model', 'N/A')
    vin = vehicle_info.get('vin', 'N/A')
    lines.append(f"Vehicle: {year} {make} {model}")
    lines.append(f"VIN: {vin}")
    lines.append(f"Mileage: {vehicle_info.get('mileage', 'N/A')}")
    lines.append(f"Damages: {vehicle_info.get('damages', 'N/A')}")
    lines.append(f"Estimated Days to Repair: {vehicle_info.get('days_to_repair', 'N/A')}")
    if nada_value:
        lines.append(f"Estimated NADA Value: ${nada_value:,}")
    if salvage_bids:
        lines.append("Salvage Bids:")
        for bid in salvage_bids:
            lines.append(f"  • {bid['vendor']}: ${bid['bid']:,}")
    lines.append(f"Conclusion: {'Total Loss' if is_total_loss else 'Repairable'}")
    return "\n".join(lines)


def generate_summary_pdf(summary_text: str, output_path: Path) -> None:
    """Exports the provided summary to a PDF file.

    This function acts as a wrapper where you can integrate a PDF
    generation library of your choosing.  Two popular choices are:

    * **reportlab** – A powerful, pure‑Python library for creating
      complex PDFs.  Install via ``pip install reportlab`` and use
      ``reportlab.pdfgen.canvas.Canvas`` to write text.  You'll need
      to manually manage page breaks and text wrapping.
    * **fpdf** (also known as **PyFPDF**) – A simpler library that
      automatically handles basic formatting and multi‑cell text.  Install
      via ``pip install fpdf2``.  Use the :class:`fpdf.FPDF` class to
      create a document and ``multi_cell`` or ``text`` methods to write
      your content.

    Example using fpdf2 (uncomment to use)::

        from fpdf import FPDF
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font('Helvetica', size=11)
        for line in summary_text.split('\n'):
            pdf.multi_cell(0, 5, line)
        pdf.output(str(output_path))

    Args:
        summary_text: The full text returned by
            :func:`build_summary_text`.
        output_path: Where to write the PDF.

    Returns:
        None.  Writes a file to ``output_path``.
    """
    # Placeholder implementation: write a plain text file instead of a PDF.
    # Replace the following lines with code that uses reportlab or fpdf.
    print(
        "generate_summary_pdf has been called.  This function is a stub. "
        "To produce a PDF, install reportlab or fpdf2 and insert the "
        "appropriate code here.  For now, the summary will be saved as "
        "a .txt file."
    )
    # Ensure the parent directory exists
    output_path = output_path.with_suffix('.txt')
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open('w', encoding='utf-8') as f:
        f.write(summary_text)
