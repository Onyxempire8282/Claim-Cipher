let map, directionsService, directionsRenderer, geocoder, homeMarker;

function initServices() {
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  geocoder = new google.maps.Geocoder();

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 4,
    center: { lat: 39.8283, lng: -98.5795 },
  });

  directionsRenderer.setMap(map);
}

window.initServices = initServices;

function optimizeRoute() {
  const origin = document.getElementById("origin").value.trim();
  const stops = Array.from(document.querySelectorAll(".claim-cipher__stop"))
    .map(input => input.value.trim()).filter(Boolean);

  if (!origin || stops.length === 0) {
    alert("Missing stops or origin!");
    return;
  }

  geocoder.geocode({ address: origin }, (results, status) => {
    if (status !== "OK") return alert("Origin error: " + status);
    const loc = results[0].geometry.location;
    map.setCenter(loc);

    if (homeMarker) homeMarker.setMap(null);
    homeMarker = new google.maps.Marker({
      position: loc,
      map,
      icon: "https://maps.google.com/mapfiles/kml/shapes/homegardenbusiness.png",
    });

    const waypoints = stops.map(addr => ({ location: addr, stopover: true }));

    directionsService.route(
      {
        origin,
        destination: origin,
        waypoints,
        optimizeWaypoints: true,
        travelMode: "DRIVING",
      },
      (res, status) => {
        if (status !== "OK") return alert("Route error: " + status);
        directionsRenderer.setDirections(res);

        const route = res.routes[0];
        const routeResults = document.getElementById("routeResults");
        const summaryPanel = document.getElementById("routeSummary");
        summaryPanel.innerHTML = "<h3>Route Summary:</h3>";
        routeResults.innerHTML = "";

        route.legs.forEach((leg, i) => {
          const segment = document.createElement("div");
          segment.classList.add("route-segment");
          segment.innerHTML = `
            <p><strong>From:</strong> ${leg.start_address}</p>
            <p><strong>To:</strong> ${leg.end_address}</p>
            <p><strong>Distance:</strong> ${leg.distance.text} | <strong>Time:</strong> ${leg.duration.text}</p>
          `;
          summaryPanel.appendChild(segment);
        });

        const orderedStops = route.legs.map((leg) => leg.end_address);
        orderedStops.forEach((stop, index) => {
          addScheduleCard(stop, index + 1);
        });
      }
    );
  });
}

function addScheduleCard(stop, index) {
  const scheduleCard = document.createElement("div");
  scheduleCard.classList.add("schedule-card");

  const header = document.createElement("h4");
  header.textContent = `Stop #${index}: ${stop}`;

  const timeField = document.createElement("input");
  timeField.type = "datetime-local";
  timeField.className = "appointment-time";

  timeField.addEventListener("change", () => {
    const selectedTime = new Date(timeField.value);
    const endTime = new Date(selectedTime.getTime() + 60 * 60 * 1000);

    const oldLinks = scheduleCard.querySelector(".calendar-links");
    if (oldLinks) oldLinks.remove();

    const gcalLink = createGoogleCalendarLink({
      title: "Claim Appointment",
      location: stop,
      description: "Scheduled site inspection.",
      startDateTime: selectedTime,
      endDateTime: endTime,
    });

    const icsLink = createICSFile({
      title: "Claim Appointment",
      location: stop,
      description: "Scheduled site inspection.",
      startDateTime: selectedTime,
      endDateTime: endTime,
    });

    const calendarBtns = document.createElement("div");
    calendarBtns.classList.add("calendar-links");
    calendarBtns.innerHTML = `
      <a href="${gcalLink}" target="_blank">📅 Add to Google Calendar</a>
      <a href="${icsLink}" download="appointment.ics">🗓️ Download Outlook/Apple Calendar File</a>
    `;

    scheduleCard.appendChild(calendarBtns);
  });

  scheduleCard.appendChild(header);
  scheduleCard.appendChild(timeField);
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
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([content.trim()], { type: 'text/calendar;charset=utf-8' });
  return URL.createObjectURL(blob);
}
