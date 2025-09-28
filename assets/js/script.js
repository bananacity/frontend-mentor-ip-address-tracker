// Selectors
const formEl = document.querySelector(".tracker__form");
const formInputEl = document.querySelector(".tracker__input");
const ipEl = document.querySelector(".tracker__value--ip");
const locationEl = document.querySelector(".tracker__value--location");
const timezoneEl = document.querySelector(".tracker__value--timezone");
const ispEl = document.querySelector(".tracker__value--isp");
const mapEl = document.querySelector(".tracker__map");
let mapMarker;

// Functions
function stripProtocol(string) {
  return string.replace(/^https?:\/\//, "");
}

function isDomain(string) {
  return /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(string);
}

async function fetchMyIPAddress() {
  try {
    let response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) {
      throw new Error("Failed to get current IP address: ", response.status);
    }

    const result = await response.json();

    const ipAddress = result.ip;

    return ipAddress;
  } catch (error) {
    console.error(`Failed to fetch IP address:`, error);
  }
}

async function fetchIPAddressInfo(ipAddress) {
  try {
    let response = await fetch(
      `https://geo.ipify.org/api/v2/country,city?apiKey=at_MLM9vx5xdsAncRUzG2vEFhWt8oEfs${
        isDomain(ipAddress) ? `&domain=${ipAddress}` : `&ipAddress=${ipAddress}`
      }`
    );
    if (!response.ok) {
      throw new Error("Failed to get IP address info: ", response.status);
    }

    const result = await response.json();

    return {
      ip: result.ip,
      location: `${result.location.city}, ${result.location.region} ${result.location.postalCode}`,
      coordinates: [result.location.lat, result.location.lng],
      timezone: `UTC ${result.location.timezone}`,
      isp: result.isp,
    };
  } catch (error) {
    console.error(`Failed to fetch IP address info: `, error);
  }
}

function updateMap(coordinates) {
  const mapMarkerIcon = L.icon({
    iconUrl: "../images/icon-location.svg",
    iconAnchor: [23, 56],
  });

  if (mapMarker) {
    map.removeLayer(mapMarker);
  }
  mapMarker = L.marker(coordinates, { icon: mapMarkerIcon }).addTo(map);
  map.flyTo(mapMarker.getLatLng(), 8);
}

function displayResults(ip, location, timezone, isp) {
  ipEl.textContent = ip ?? "-";
  locationEl.textContent = location ?? "-";
  timezoneEl.textContent = timezone ?? "-";
  ispEl.textContent = isp ?? "-";
}

async function updateTracker(input) {
  input = stripProtocol(input);

  const ipInfo = await fetchIPAddressInfo(input);

  if (!ipInfo) {
    return;
  }

  const { ip, location, coordinates, timezone, isp } = ipInfo;

  displayResults(ip, location, timezone, isp);
  updateMap(coordinates);
}

// Map
const map = L.map(mapEl, {
  zoomControl: false,
}).setView([42.58546, -34.388554], 4);

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
}).addTo(map);

L.control.zoom({ position: "bottomleft" }).addTo(map);

// Listeners
fetchMyIPAddress().then((ip) => updateTracker(ip));

formEl.addEventListener("submit", (event) => {
  event.preventDefault();

  const ip = formInputEl.value;

  if (!ip) {
    return;
  }

  updateTracker(ip);
});

// background image on smaller screens is leaving white space at the bottom so fix that
