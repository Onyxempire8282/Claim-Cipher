function addScheduleTable(stops, origin) {
  const container = document.createElement("div");
  container.className = "schedule-card";
  container.innerHTML = `
    <h3>Weekly Schedule</h3>
    <button id="openSchedule">Open Schedule Builder</button>
  `;
  document.getElementById("routeResults").appendChild(container);

  document.getElementById("openSchedule").onclick = () => {
    showScheduleModal(stops, origin);
  };
}

function showScheduleModal(stops, origin) {
  const modal = document.getElementById("scheduleModal");
  modal.style.display = "block";

  document.getElementById("closeModal").onclick = () => {
    modal.style.display = "none";
  };

  window.onclick = event => {
    if (event.target == modal) modal.style.display = "none";
  };
}
