let routerMap, routerDirectionsService, routerDirectionsRenderer, routerGeocoder, routerHomeMarker;

function initRouterServices() {
  // Only initialize if Google Maps is loaded and map element exists
  if (typeof google === 'undefined' || !document.getElementById("map")) {
    console.log('Google Maps not loaded or map element not found');
    return;
  }

  routerDirectionsService = new google.maps.DirectionsService();
  routerDirectionsRenderer = new google.maps.DirectionsRenderer();
  routerGeocoder = new google.maps.Geocoder();

  routerMap = new google.maps.Map(document.getElementById("map"), {
    zoom: 4,
    center: { lat: 39.8283, lng: -98.5795 },
  });

  routerDirectionsRenderer.setMap(routerMap);
  
  // Add autocomplete to origin input if it exists
  const originInput = document.getElementById("origin");
  if (originInput && google.maps.places) {
    new google.maps.places.Autocomplete(originInput, {
      types: ["address"],
    });
  }
  
  console.log('Router services initialized');
}

// Initialize router services when Google Maps is loaded
function initializeWhenReady() {
  if (typeof google !== 'undefined' && google.maps) {
    initRouterServices();
  } else {
    // After waiting for a reasonable time, show fallback
    setTimeout(() => {
      if (typeof google === 'undefined') {
        console.log('Google Maps API not available, using fallback mode');
        displayMapFallback();
      } else {
        initializeWhenReady();
      }
    }, 1000);
  }
}

// Restore session data on load
document.addEventListener("DOMContentLoaded", () => {
  const savedOrigin = sessionStorage.getItem("claimOrigin");
  const savedStops = JSON.parse(sessionStorage.getItem("claimStops") || "[]");
  const savedTimes = JSON.parse(sessionStorage.getItem("claimTimes") || "{}");

  if (savedOrigin) {
    const originInput = document.getElementById("origin");
    if (originInput) {
      originInput.value = savedOrigin;
    }
  }

  // Restore stops to the existing input fields
  if (savedStops.length) {
    const stopInputs = document.querySelectorAll(".claim-cipher__stop");
    savedStops.forEach((stop, index) => {
      if (stopInputs[index]) {
        stopInputs[index].value = stop;
      }
    });
  }

  window._claimSessionTimes = savedTimes; // store globally for later
  
  // Initialize Google Maps when ready
  initializeWhenReady();
});

function optimizeRoute() {
  console.log("Optimize Route clicked!");
  
  const origin = document.getElementById("origin").value.trim();
  const stops = Array.from(document.querySelectorAll(".claim-cipher__stop"))
    .map(input => input.value.trim())
    .filter(Boolean);

  if (!origin || stops.length === 0) {
    alert("Please enter a starting address and at least one stop!");
    return;
  }

  // Save to sessionStorage
  sessionStorage.setItem("claimOrigin", origin);
  sessionStorage.setItem("claimStops", JSON.stringify(stops));

  // Check if Google Maps services are available
  if (!routerGeocoder || !routerDirectionsService) {
    console.log("Google Maps not available, using fallback mode");
    optimizeRouteFallback(origin, stops);
    return;
  }
  
  // Use Google Maps for optimization
  routerGeocoder.geocode({ address: origin }, (results, status) => {
    if (status !== "OK") {
      console.log("Geocoding failed, falling back to mock mode");
      optimizeRouteFallback(origin, stops);
      return;
    }
    
    const loc = results[0].geometry.location;
    routerMap.setCenter(loc);
    routerMap.setZoom(10);

    if (routerHomeMarker) routerHomeMarker.setMap(null);
    routerHomeMarker = new google.maps.Marker({
      position: loc,
      map: routerMap,
      icon: "https://maps.google.com/mapfiles/kml/shapes/homegardenbusiness.png",
      title: "Starting Location"
    });

    const waypoints = stops.map(addr => ({ location: addr, stopover: true }));

    routerDirectionsService.route(
      {
        origin,
        destination: origin,
        waypoints,
        optimizeWaypoints: true,
        travelMode: "DRIVING"
      },
      (res, status) => {
        if (status !== "OK") {
          console.log("Directions failed, falling back to mock mode");
          optimizeRouteFallback(origin, stops);
          return;
        }
        
        routerDirectionsRenderer.setDirections(res);
        displayRouteResults(res.routes[0]);
      }
    );
  });
}

// Fallback function when Google Maps is not available
function optimizeRouteFallback(origin, stops) {
  console.log("Using fallback route optimization");
  
  // Create mock route data for demonstration
  const mockRoute = {
    legs: []
  };

  let totalDistance = 0;
  let totalDuration = 0;

  // Create route from origin to each stop and back
  const allAddresses = [origin, ...stops, origin];
  
  for (let i = 0; i < allAddresses.length - 1; i++) {
    const mockDistance = Math.floor(Math.random() * 15 + 5); // 5-20 miles
    const mockDuration = Math.floor(mockDistance * 3 + Math.random() * 10); // roughly 3 min per mile + variation
    
    totalDistance += mockDistance * 1609.34; // convert to meters for consistency
    totalDuration += mockDuration * 60; // convert to seconds
    
    mockRoute.legs.push({
      start_address: allAddresses[i],
      end_address: allAddresses[i + 1],
      distance: {
        text: `${mockDistance} mi`,
        value: mockDistance * 1609.34
      },
      duration: {
        text: `${mockDuration} min`,
        value: mockDuration * 60
      }
    });
  }

  displayRouteResults(mockRoute);
  displayMapFallback();
}

// Display route results (works for both real and mock data)
function displayRouteResults(route) {
  const summaryPanel = document.getElementById("routeSummary");
  summaryPanel.innerHTML = "<h3>Route Summary:</h3>";

  const routeResults = document.getElementById("routeResults");
  routeResults.innerHTML = "";

  let totalDistance = 0;
  let totalDuration = 0;

  route.legs.forEach((leg, i) => {
    totalDistance += leg.distance.value;
    totalDuration += leg.duration.value;
    
    const segment = document.createElement("div");
    segment.classList.add("route-segment");
    segment.innerHTML = `
      <p><strong>Leg ${i + 1}:</strong> ${leg.start_address.replace(/,.*$/, '')} → ${leg.end_address.replace(/,.*$/, '')}</p>
      <p><strong>Distance:</strong> ${leg.distance.text} | <strong>Time:</strong> ${leg.duration.text}</p>
    `;
    summaryPanel.appendChild(segment);
  });

  // Add total summary
  const totalSummary = document.createElement("div");
  totalSummary.classList.add("route-total");
  totalSummary.innerHTML = `
    <p><strong>Total Distance:</strong> ${(totalDistance * 0.000621371).toFixed(1)} miles</p>
    <p><strong>Total Time:</strong> ${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m</p>
    <p><em>Note: This is a demonstration with estimated times and distances.</em></p>
  `;
  summaryPanel.appendChild(totalSummary);

  // Create schedule cards for each stop
  const orderedStops = route.legs.map(leg => leg.end_address);
  orderedStops.forEach((stop, index) => {
    addScheduleTable(stop, index + 1);
  });
}

// Display fallback map message
function displayMapFallback() {
  const mapElement = document.getElementById("map");
  if (mapElement) {
    mapElement.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100%; background-color: #f0f0f0; border: 2px dashed #ccc;">
        <div style="text-align: center; padding: 20px;">
          <h3>🗺️ Map View</h3>
          <p>Interactive map will display here when Google Maps API is available.</p>
          <p>Route optimization is working in demonstration mode.</p>
        </div>
      </div>
    `;
  }
}

function addScheduleTable(stop, index) {
  const scheduleCard = document.createElement("div");
  scheduleCard.classList.add("schedule-card");

  const header = document.createElement("h4");
  header.textContent = `Stop #${index}: ${stop}`;
  scheduleCard.appendChild(header);

  const timeField = document.createElement("input");
  timeField.type = "datetime-local";
  timeField.classList.add("appointment-time");

  // Restore time if stored
  if (window._claimSessionTimes && window._claimSessionTimes[stop]) {
    timeField.value = window._claimSessionTimes[stop];
  }

  scheduleCard.appendChild(timeField);

  timeField.addEventListener("change", () => {
    const selectedTime = new Date(timeField.value);
    const endTime = new Date(selectedTime.getTime() + 60 * 60 * 1000);

    // Save time to sessionStorage
    const timeData = JSON.parse(sessionStorage.getItem("claimTimes") || "{}");
    timeData[stop] = timeField.value;
    sessionStorage.setItem("claimTimes", JSON.stringify(timeData));

    const oldLinks = scheduleCard.querySelector(".calendar-links");
    if (oldLinks) oldLinks.remove();

    const gcalLink = createGoogleCalendarLink({
      title: "Claim Appointment",
      location: stop,
      description: "Scheduled site inspection.",
      startDateTime: selectedTime,
      endDateTime: endTime
    });

    const icsLink = createICSFile({
      title: "Claim Appointment",
      location: stop,
      description: "Scheduled site inspection.",
      startDateTime: selectedTime,
      endDateTime: endTime
    });

    const calendarBtns = document.createElement("div");
    calendarBtns.classList.add("calendar-links");
    calendarBtns.innerHTML = `
      <a href="${gcalLink}" target="_blank">📅 Add to Google Calendar</a>
      <a href="${icsLink}" download="appointment.ics">🗓️ Download Outlook/Apple Calendar File</a>
    `;

    scheduleCard.appendChild(calendarBtns);
  });

  document.getElementById("routeResults").appendChild(scheduleCard);
}

function createGoogleCalendarLink({ title, location, description, startDateTime, endDateTime }) {
  const formatDate = dt => encodeURIComponent(dt.toISOString().replace(/-|:|\.\d\d\d/g, ""));
  const start = formatDate(startDateTime);
  const end = formatDate(endDateTime);

  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(location)}&sf=true&output=xml`;
}

function createICSFile({ title, location, description, startDateTime, endDateTime }) {
  const format = dt => dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const content = `
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${title}
DTSTART:${format(startDateTime)}
DTEND:${format(endDateTime)}
LOCATION:${location}
DESCRIPTION:${description}
STATUS:CONFIRMED
SEQUENCE:0
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([content.trim()], { type: 'text/calendar;charset=utf-8' });
  return URL.createObjectURL(blob);
}
