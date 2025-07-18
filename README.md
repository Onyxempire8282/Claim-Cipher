# Claim Cipher - Route Optimizer

## 📍 Purpose
This module generates optimized daily routes for vehicle inspections or site visits.  
It includes:
- Google Maps or Leaflet integration
- Origin input (start location)
- Schedule table with customizable time slots (now supports half-hour increments!)
- Mileage & drive time calculation
- Printable or exportable routes

## 📁 Structure
- `/blocks/` → reusable BEM-style CSS blocks (header, buttons, forms, map)
- `/pages/` → page-specific CSS (index, schedule, print)
- `/vendor/` → normalize.css, maps libraries, or future 3rd party tools
- `map.js` → handles route optimization & mapping
- `schedule.js` → builds the inspector’s schedule table
- `utils.js` → common functions: time formatting, distance conversion, etc.
- `index.html` → entry page for this tool

## 🛠️ Next Steps
- Hook up user authentication if needed
- Add “Save Route” feature
- Connect to Claim Summary module for total daily billing

---

**Built as part of Claim Cipher — your adjuster & appraiser survival suite.**

# Claim-Cipher
