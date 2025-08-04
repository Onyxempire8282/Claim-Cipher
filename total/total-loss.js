/*
 * Claim Cipher – Total Loss Estimator logic
 *
 * This script must live in the `Claim-Cipher/total/` folder.  It
 * implements the complete workflow for parsing a CCC ONE estimate, populating
 * the BCIF form, decoding the VIN via the NHTSA vPIC API, calculating a
 * placeholder NADA value, generating sample salvage bids and assembling a
 * claim summary.  It uses PDF.js and jsPDF, loaded via CDN in the HTML.
 *
 * Note: IDs on HTML elements are retained for ease of selection.  BEM
 * classes (claim-cipher__total-loss-*) are used for styling only and do
 * not affect the JavaScript.
 */

// Configure PDF.js (loaded via CDN in index.html)
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.6.172/pdf.worker.min.js';

// Grab references to elements once on page load
const estimateInput = document.getElementById('estimateInput');
const parseButton = document.getElementById('parseButton');
const parseStatus = document.getElementById('parseStatus');
const bcifForm = document.getElementById('bcifForm');

// Workflow steps
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');
const step5 = document.getElementById('step5');

// Additional controls
const decodeButton = document.getElementById('decodeButton');
const vinDetails = document.getElementById('vinDetails');
const salvageTableBody = document.querySelector('#salvageTable tbody');
const summaryButton = document.getElementById('summaryButton');
const salvageButton = document.getElementById('salvageButton');
const summaryContainer = document.getElementById('summaryContainer');
const isTotalLossCheckbox = document.getElementById('isTotalLoss');
const downloadPdfButton = document.getElementById('downloadPdfButton');
const copyTextButton = document.getElementById('copyTextButton');

// Enable parse button when a file is selected
estimateInput.addEventListener('change', () => {
  parseButton.disabled = !(estimateInput.files && estimateInput.files.length);
  parseStatus.textContent = '';
});

// Parse the selected PDF estimate and populate form fields
parseButton.addEventListener('click', async () => {
  const file = estimateInput.files[0];
  if (!file) return;
  parseStatus.textContent = 'Parsing estimate…';
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let extracted = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      extracted += content.items.map(item => item.str).join(' ');
    }
    // Basic regex extraction of common fields
    const vinMatch = extracted.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
    const yearMatch = extracted.match(/\b(19\d{2}|20\d{2})\b/);
    const makeMatch = extracted.match(/\bMake\s*[:\-]?\s*([A-Za-z0-9]+)/i);
    const modelMatch = extracted.match(/\bModel\s*[:\-]?\s*([A-Za-z0-9]+)/i);
    const mileageMatch = extracted.match(/\b(\d{1,6})\s*(?:miles|mi)\b/i);
    const damagesMatch = extracted.match(/\bDamage(?:s)?\s*[:\-]?\s*([A-Za-z0-9 ,]+)/i);
    if (vinMatch) bcifForm.vin.value = vinMatch[1];
    if (yearMatch) bcifForm.year.value = yearMatch[1];
    if (makeMatch) bcifForm.make.value = makeMatch[1];
    if (modelMatch) bcifForm.model.value = modelMatch[1];
    if (mileageMatch) bcifForm.mileage.value = mileageMatch[1];
    if (damagesMatch) bcifForm.damages.value = damagesMatch[1];
    parseStatus.textContent = 'Estimate parsed. Please review and edit the BCIF.';
    step2.hidden = false;
  } catch (err) {
    console.error(err);
    parseStatus.textContent = 'Failed to parse PDF.';
  }
});

// Decode the VIN via NHTSA vPIC API and compute a placeholder NADA value
decodeButton.addEventListener('click', async () => {
  const vin = bcifForm.vin.value.trim();
  if (!vin) return;
  vinDetails.textContent = 'Decoding VIN…';
  try {
    const resp = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
    const data = await resp.json();
    const results = data.Results;
    const yearInfo = results.find(r => r.Variable === 'Model Year');
    const makeInfo = results.find(r => r.Variable === 'Make');
    const modelInfo = results.find(r => r.Variable === 'Model');
    const year = yearInfo && yearInfo.Value || bcifForm.year.value;
    const make = makeInfo && makeInfo.Value || bcifForm.make.value;
    const model = modelInfo && modelInfo.Value || bcifForm.model.value;
    if (year) bcifForm.year.value = year;
    if (make) bcifForm.make.value = make;
    if (model) bcifForm.model.value = model;
    const now = new Date().getFullYear();
    const age = year ? Math.max(0, now - parseInt(year, 10)) : 0;
    const nada = 30000 * Math.pow(0.93, age);
    vinDetails.innerHTML = `Decoded VIN: ${vin}<br>Year: ${year}<br>Make: ${make}<br>Model: ${model}<br>Placeholder NADA Value: $${nada.toFixed(2)}`;
    step3.hidden = false;
  } catch (err) {
    console.error(err);
    vinDetails.textContent = 'Failed to decode VIN.';
  }
});

// Generate example salvage bids based on a depreciation model
salvageButton.addEventListener('click', () => {
  const year = bcifForm.year.value;
  const now = new Date().getFullYear();
  const age = year ? Math.max(0, now - parseInt(year, 10)) : 0;
  const base = 30000 * Math.pow(0.93, age);
  const vendors = [
    { name: 'SellMax', factor: 0.45 },
    { name: 'Cash Auto Salvage', factor: 0.40 },
    { name: 'Peddle', factor: 0.42 },
  ];
  salvageTableBody.innerHTML = '';
  vendors.forEach(({ name, factor }) => {
    const bid = base * factor;
    const row = document.createElement('tr');
    row.innerHTML = `<td>${name}</td><td>$${bid.toFixed(2)}</td>`;
    salvageTableBody.appendChild(row);
  });
  step4.hidden = false;
});

// Assemble the claim summary and reveal Step 5
summaryButton.addEventListener('click', () => {
  const lines = [];
  lines.push(`Customer Name: ${bcifForm.customerName.value}`);
  lines.push(`Adjuster Name: ${bcifForm.adjusterName.value}`);
  lines.push(`Claim Number: ${bcifForm.claimNumber.value}`);
  lines.push(`Date of Loss: ${bcifForm.dateOfLoss.value}`);
  lines.push(`Inspection Location: ${bcifForm.inspectionLocation.value}`);
  lines.push(`VIN: ${bcifForm.vin.value}`);
  lines.push(`Year/Make/Model: ${bcifForm.year.value} ${bcifForm.make.value} ${bcifForm.model.value}`);
  lines.push(`Mileage: ${bcifForm.mileage.value}`);
  lines.push(`Damages: ${bcifForm.damages.value}`);
  lines.push(`Estimated Days to Repair: ${bcifForm.daysToRepair.value}`);
  lines.push('');
  lines.push('Salvage Bids:');
  Array.from(salvageTableBody.children).forEach(row => {
    lines.push(`  - ${row.children[0].textContent}: ${row.children[1].textContent}`);
  });
  lines.push('');
  lines.push(`Total Loss Status: ${isTotalLossCheckbox.checked ? 'Total Loss' : 'Repairable'}`);
  summaryContainer.textContent = lines.join('\n');
  step5.hidden = false;
});

// Export the summary as a PDF using jsPDF
downloadPdfButton.addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const lines = summaryContainer.textContent.split('\n');
  let y = 10;
  lines.forEach(line => {
    doc.text(line, 10, y);
    y += 7;
  });
  doc.save('claim_summary.pdf');
});

// Copy the summary text to the clipboard
copyTextButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(summaryContainer.textContent);
    alert('Summary copied to clipboard');
  } catch (err) {
    console.error(err);
    alert('Failed to copy summary');
  }
});