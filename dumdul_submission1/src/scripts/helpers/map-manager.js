class MapManager {
  static createMap(elementId, center = [-2.5489, 118.0149], zoom = 5) {
    const map = L.map(elementId).setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    return map;
  }

  static placeMarker(map, lat, lon, popupContent) {
    const marker = L.marker([lat, lon]).addTo(map);
    
    if (popupContent) {
      marker.bindPopup(popupContent);
    }

    return marker;
  }

  static placeClickableMarker(map, lat, lon, popupContent, onClick) {
    const marker = this.placeMarker(map, lat, lon, popupContent);
    
    if (onClick) {
      marker.on('click', onClick);
    }

    return marker;
  }

  static placeMultipleMarkers(map, locations) {
    return locations
      .filter(loc => loc.lat && loc.lon)
      .map(loc => this.placeMarker(map, loc.lat, loc.lon, loc.popup));
  }

  static getHighlightedIcon() {
    return L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  static getDefaultIcon() {
     return L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }

  static highlightMarker(marker) {
    marker.setIcon(this.getHighlightedIcon());
  }

  static resetMarkerIcon(marker) {
    marker.setIcon(this.getDefaultIcon());
  }

  static panToLocation(map, lat, lon, zoom = 13) {
    map.flyTo([lat, lon], zoom, {
      duration: 1.5
    });
  }

  static fitMapToMarkers(map, locations) {
    if (!locations || locations.length === 0) return;

    const validCoords = locations.map(loc => [loc.lat, loc.lon]);
    const bounds = L.latLngBounds(validCoords);
    
    map.fitBounds(bounds, { padding: [50, 50] });
  }

  static addMapClickListener(map, callback) {
    map.on('click', (e) => {
      callback(e.latlng.lat, e.latlng.lng);
    });
  }
}

export default MapManager;