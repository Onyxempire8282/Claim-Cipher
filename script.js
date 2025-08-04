/*
 * Patched root script for Claim Cipher
 *
 * The original script unconditionally initialized Google Maps on every
 * page via `window.onload = initServices;`.  This caused errors on pages
 * that do not contain a `map` element (e.g. the new total‑loss page).
 *
 * This version waits for the DOMContentLoaded event, then checks if the
 * `map` element exists before calling `initServices()`.  All other
 * functions remain unchanged.  Replace your existing `script.js` at the
 * root of the repository with this version to prevent map initialisation
 * errors on non‑router pages.
 */

const ORIGIN = "715 SANDHILL DR, DUDLEY, NC 28333";

let map, directionsService, directionsRenderer, geocoder, homeMarker;

function initServices() {
  // Do not attempt to initialize the map if the element doesn't exist
  const mapEl = document.getElementById("map");
  if (!mapEl) {
    return;
  }
  console.log("Initializing Maps...");
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  geocoder = new google.maps.Geocoder();
  map = new google.maps.Map(mapEl, {
    zoom: 4,
    center: { lat: 39.8283, lng: -98.5795 },
  });
  directionsRenderer.setMap(map);
  new google.maps.places.Autocomplete(document.getElementById("origin"), {
    types: ["address"],
  });
}

// Initialize services on pages with a map after DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  initServices();
});

function calculateDistance() {
  console.log("Calculate Distance clicked!");
  const destination = document.getElementById("destination").value;
  const resultDiv = document.getElementById("billingResult");
  resultDiv.innerHTML = "Calculating...";
  const service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix(
    {
      origins: [ORIGIN],
      destinations: [destination],
      travelMode: "DRIVING",
      unitSystem: google.maps.UnitSystem.IMPERIAL,
    },
    (response, status) => {
      if (status === "OK") {
        const dist = parseFloat(
          response.rows[0].elements[0].distance.text.replace(/[^0-9.]/g, "")
        );
        const roundTrip = dist * 2;
        document.getElementById("totalMiles").value = roundTrip.toFixed(2);
        calculateBilling();
      } else {
        alert("Distance error: " + status);
      }
    }
  );
}

function calculateBilling() {
  console.log("Calculate Billing clicked!");
  const firm = document.getElementById("firm").value;
  const miles = parseFloat(document.getElementById("totalMiles").value);
  if (isNaN(miles)) {
    alert("No miles yet!");
    return;
  }
  let freeMiles = 50,
    rate = 0.6;
  if (firm === "FirmA") {
    freeMiles = 50;
    rate = 0.67;
  }
  const billable = Math.max(0, miles - freeMiles);
  const cost = billable * rate;
  document.getElementById("billingResult").textContent = `(${miles} RT - ${freeMiles} Free) = ${billable} mi x $${rate} = $${cost.toFixed(2)}`;
}

