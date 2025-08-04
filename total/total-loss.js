/*
 * Claim Cipher – Total Loss Estimator Logic
 *
 * This JavaScript file contains all of the client‑side logic for parsing
 * uploaded CCC ONE estimates, populating the BCIF form, decoding the VIN via
 * the NHTSA vPIC API, calculating a placeholder NADA value, generating
 * example salvage bids and assembling a claim summary.  It is largely
 * identical to the script shipped in the standalone total loss module, but
 * lives within the Claim Cipher codebase so that it can leverage existing
 * styling and navigation.  IDs on elements are preserved for ease of
 * selection; additional classes were added for BEM compliance in the HTML.
 */

// PDF.js configuration (loaded via CDN in index.html)
const pdfjsLib = window['pdfjs-dist/build/pdf'];
// Specify the workerSrc property if using PDF.js outside of a bundler
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.6.172/pdf.worker.min.js';

// Element references
const estimateInput = document.getElementById('estimateInput');
const parseButton = document.getElementById('parseButton');
const parseStatus = document.getElementById('parseStatus');

const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');
const step5 = document.getElementById('step5');

const bcifForm = document.getElementById('bcifForm');
const decodeButton = document.getElementById('decodeButton');
const vinDetails = document.getElementById('vinDetails');
const salvageTableBody = document.querySelector('#salvageTable tbody');
const summaryContainer = document.getElementById('summaryContainer');
const summaryButton = document.getElementById('summaryButton');
const salvageButton = document.getElementById('salvageButton');
const downloadPdfButton = document.getElementById('downloadPdfButton');
const copyTextButton = document.getElementById('copyTextButton');
const isTotalLossCheckbox = document.getElementById('isTotalLoss');

// Listen for file selection to enable the parse button
estimateInput.addEventListener('change', () => {
  parseButton.disabled = !estimateInput.files || estimateInput.files.length === 0;
  parseStatus.textContent = '';
});

// Parse the selected PDF estimate
parseButton.addEventListener('click', async () => {
  const file = estimateInput.files[0];
  if (!file) return;
  parseStatus.textContent = 'Parsing estimate…';
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let extractedText = '';
    // Loop through all pages and extract text
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      extractedText += '\n' + pageText;
    }
    // Use simple regular expressions to extract key fields
    const vinMatch = extractedText.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
    const yearMatch = extractedText.match(/\b(19\d{2}|20\d{2})\b/);
    const makeMatch = extractedText.match(/\bMake\s*[:\-]?\s*([A-Za-z0-9]+)/i);
    const modelMatch = extractedText.match(/\bModel\s*[:\-]?\s*([A-Za-z0-9]+)/i);
    const mileageMatch = extractedText.match(/\b(\d{1,6})\s*(?:miles|mi)\b/i);
    const damagesMatch = extractedText.match(/\bDamage(?:s)?\s*[:\-]?\s*([A-Za-z0-9 ,]+)/i);
    // Populate form fields if found
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
    parseStatus.textContent = 'Failed to parse PDF. Please try another file.';
  }
});

// Decode the VIN using NHTSA vPIC API and calculate placeholder NADA value
decodeButton.addEventListener('click', async () => {
  const vin = bcifForm.vin.value.trim();
  if (!vin) return;
  vinDetails.textContent = 'Decoding VIN…';
  try {
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
    const data = await response.json();
    // Extract year, make, model from API results
    const results = data.Results;
    const yearInfo = results.find(item => item.Variable === 'Model Year');
    const makeInfo = results.find(item => item.Variable === 'Make');
    const modelInfo = results.find(item => item.Variable === 'Model');
    const year = yearInfo ? yearInfo.Value : bcifForm.year.value;
    const make = makeInfo ? makeInfo.Value : bcifForm.make.value;
    const model = modelInfo ? modelInfo.Value : bcifForm.model.value;
    // Fill the form with decoded values if available
    if (year) bcifForm.year.value = year;
    if (make) bcifForm.make.value = make;
    if (model) bcifForm.model.value = model;
    // Calculate a placeholder NADA value: base 30000 minus 7% per year of age
    const currentYear = new Date().getFullYear();
    const age = year ? Math.max(0, currentYear - parseInt(year, 10)) : 0;
    const nadaValue = 30000 * Math.pow(0.93, age);
    vinDetails.innerHTML = `Decoded VIN: ${vin}<br>Year: ${year}<br>Make: ${make}<br>Model: ${model}<br>Placeholder NADA Value: $${nadaValue.toFixed(2)}`;
    step3.hidden = false;
  } catch (err) {
    console.error(err);
    vinDetails.textContent = 'Failed to decode VIN. Please try again.';
  }
});

// Generate example salvage bids
salvageButton.addEventListener('click', () => {
  // Gather inputs
  const year = bcifForm.year.value;
  const make = bcifForm.make.value;
  const model = bcifForm.model.value;
  const mileage = bcifForm.mileage.value;
  // Estimate a base value using the same depreciation as NADA placeholder
  const currentYear = new Date().getFullYear();
  const age = year ? Math.max(0, currentYear - parseInt(year, 10)) : 0;
  const baseValue = 30000 * Math.pow(0.93, age);
  // Example vendors and their bid factors
  const vendors = [
    { name: 'SellMax', factor: 0.45 },
    { name: 'Cash Auto Salvage', factor: 0.40 },
    { name: 'Peddle', factor: 0.42 }
  ];
  // Clear previous rows
  salvageTableBody.innerHTML = '';
  vendors.forEach(vendor => {
    const bid = baseValue * vendor.factor;
    const row = document.createElement('tr');
    const vendorCell = document.createElement('td');
    vendorCell.textContent = vendor.name;
    const bidCell = document.createElement('td');
    bidCell.textContent = `$${bid.toFixed(2)}`;
    row.appendChild(vendorCell);
    row.appendChild(bidCell);
    salvageTableBody.appendChild(row);
  });
  step4.hidden = false;
});

// Assemble claim summary and show Step 5
summaryButton.addEventListener('click', () => {
  const summaryLines = [];
  summaryLines.push(`Customer Name: ${bcifForm.customerName.value}`);
  summaryLines.push(`Adjuster Name: ${bcifForm.adjusterName.value}`);
  summaryLines.push(`Claim Number: ${bcifForm.claimNumber.value}`);
  summaryLines.push(`Date of Loss: ${bcifForm.dateOfLoss.value}`);
  summaryLines.push(`Inspection Location: ${bcifForm.inspectionLocation.value}`);
  summaryLines.push(`VIN: ${bcifForm.vin.value}`);
  summaryLines.push(`Year/Make/Model: ${bcifForm.year.value} ${bcifForm.make.value} ${bcifForm.model.value}`);
  summaryLines.push(`Mileage: ${bcifForm.mileage.value}`);
  summaryLines.push(`Damages: ${bcifForm.damages.value}`);
  summaryLines.push(`Estimated Days to Repair: ${bcifForm.daysToRepair.value}`);
  // Append salvage bids
  summaryLines.push('');
  summaryLines.push('Salvage Bids:');
  for (const row of salvageTableBody.children) {
    const vendor = row.children[0].textContent;
    const bid = row.children[1].textContent;
    summaryLines.push(`  - ${vendor}: ${bid}`);
  }
  // Append placeholder total loss status
  summaryLines.push('');
  summaryLines.push(`Total Loss Status: ${isTotalLossCheckbox.checked ? 'Total Loss' : 'Repairable'}`);
  const summaryText = summaryLines.join('\n');
  summaryContainer.textContent = summaryText;
  step5.hidden = false;
});

// Download summary as PDF using jsPDF
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

// Copy summary text to clipboard
copyTextButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(summaryContainer.textContent);
    alert('Summary copied to clipboard');
  } catch (err) {
    console.error(err);
    alert('Failed to copy summary');
  }
});