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
  // ✅ this will now work because geocoder is defined above
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

        // Remove previous schedule builder(s)
        const routeResults = document.getElementById("routeResults");
        // Remove all children with class schedule-card
        Array.from(routeResults.querySelectorAll('.schedule-card')).forEach(el => el.remove());

        // Add a schedule builder for each stop
        stops.forEach(stop => {
          addScheduleTable([stop], origin);
        });
      }
    );
  });
}
