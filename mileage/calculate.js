const ORIGIN = "715 SANDHILL DR, DUDLEY, NC 28333";

let map, directionsService, directionsRenderer, geocoder, homeMarker;

function initServices() {
  console.log("Initializing Maps...");
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  geocoder = new google.maps.Geocoder();

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 4,
    center: { lat: 39.8283, lng: -98.5795 },
  });

  directionsRenderer.setMap(map);

  new google.maps.places.Autocomplete(document.getElementById("origin"), {
    types: ["address"],
  });
}

window.onload = initServices;

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
        const dist = parseFloat(response.rows[0].elements[0].distance.text.replace(/[^0-9.]/g, ""));
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
  let freeMiles = 50, rate = 0.6;
  switch (firm) {
    case "FirmA": // AMA
      freeMiles = 50; rate = 0.67; break;
    case "FirmB": // A-TEAM
      freeMiles = 60; rate = 0.55; break;
    case "FirmC": // CLAIM SOLUTION
      freeMiles = 50; rate = 0.63; break;
    case "FirmD": // CCS
      freeMiles = 50; rate = 0.65; break;
    case "FirmE": // HEA
      freeMiles = 50; rate = 0.60; break;
    case "FirmF": // IAS
      freeMiles = 50; rate = 0.65; break;
    case "FirmG": // Sedgwick
      freeMiles = 60; rate = 0.67; break;
    // Add more cases as needed
  }

  function copyResult() {
  const result = document.getElementById("billingResult").textContent;
  if (!result) {
    alert("Nothing to copy!");
    return;
  }
  navigator.clipboard.writeText(result)
    .then(() => alert("Result copied!"))
    .catch(() => alert("Copy failed!"));
}
  const billable = Math.max(0, miles - freeMiles);
  const cost = billable * rate;
  document.getElementById("billingResult").textContent =
    `(${miles} RT - ${freeMiles} Free) = ${billable} mi x $${rate} = $${cost.toFixed(2)}`;
}