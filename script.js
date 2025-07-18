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
  if (firm === "FirmA") { freeMiles = 50; rate = 0.67; }
  const billable = Math.max(0, miles - freeMiles);
  const cost = billable * rate;
  document.getElementById("billingResult").textContent =
    `(${miles} RT - ${freeMiles} Free) = ${billable} mi x $${rate} = $${cost.toFixed(2)}`;
}


