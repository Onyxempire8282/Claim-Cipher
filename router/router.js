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
  console.log("Optimize Route clicked!");
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
        travelMode: "DRIVING"
      },
      (res, status) => {
        if (status !== "OK") return alert("Route error: " + status);
        directionsRenderer.setDirections(res);

        const route = res.routes[0];
        const summaryPanel = document.getElementById("routeSummary");
        summaryPanel.innerHTML = "<h3>Route Summary:</h3>";

        const routeResults = document.getElementById("routeResults");
        routeResults.innerHTML = "";

        route.legs.forEach((leg, i) => {
          const stop = leg.end_address;
          const segment = document.createElement("div");
          segment.classList.add("route-segment");

          segment.innerHTML = `
            <p><strong>From:</strong> ${leg.start_address}</p>
            <p><strong>To:</strong> ${leg.end_address}</p>
            <p><strong>Distance:</strong> ${leg.distance.text} | <strong>Time:</strong> ${leg.duration.text}</p>
          `;

          // Add time picker
          const timeField = document.createElement("input");
          timeField.type = "datetime-local";
          timeField.classList.add("appointment-time");
          timeField.style.marginTop = "1rem";
          segment.appendChild(timeField);

          // Add container for calendar links
          const calendarContainer = document.createElement("div");
          calendarContainer.classList.add("calendar-links");
          segment.appendChild(calendarContainer);

          // Build calendar links on change
          timeField.addEventListener("change", () => {
            const selectedTime = new Date(timeField.value);
            const endTime = new Date(selectedTime.getTime() + 60 * 60 * 1000);

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

            calendarContainer.innerHTML = `
              <a href="${gcalLink}" target="_blank">📅 Add to Google Calendar</a>
              <a href="${icsLink}" download="appointment.ics">🗓️ Outlook/Apple</a>
            `;
          });

          summaryPanel.appendChild(segment);
        });
      }
    );
  });
}
