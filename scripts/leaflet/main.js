function load() {
    if(!location.href.includes('foxyspoofers')) {
        console.log('[Leaflet] Interface détectée, injection confirmée.');
        return;
    }

    if (typeof L === "undefined" || typeof L.Control.Geocoder === "undefined") return;

    // Valeurs initiales
    console.log('[Leaflet] Chargement de la carte Leaflet');
    const latInput = document.getElementById('geo-lat');
    const lonInput = document.getElementById('geo-lon');
    const lat = latInput ? parseFloat(latInput?.value) || 48.858844 : 48.858844;
    const lon = lonInput ? parseFloat(lonInput?.value) || 2.294351 : 2.294351;
    console.log(`Initial position: lat=${lat}, lon=${lon}`);

    // Init map
    if(!document.getElementById('geo-map')) return;
    const map = L.map('geo-map').setView([lat, lon], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // Marker
    let marker = L.marker([lat, lon], {draggable:true}).addTo(map);

    // Drag marker
    marker.on('dragend', function(e) {
        const pos = marker.getLatLng();
        latInput.value = pos.lat.toFixed(6);
        lonInput.value = pos.lng.toFixed(6);
    });

    // Click map
    map.on('click', function(e) {
        marker.setLatLng(e.latlng);
        latInput.value = e.latlng.lat.toFixed(6);
        lonInput.value = e.latlng.lng.toFixed(6);
    });

    // Geocoder (barre de recherche)
    L.Control.geocoder({
        defaultMarkGeocode: false
    })
    .on('markgeocode', function(e) {
        const center = e.geocode.center;
        marker.setLatLng(center);
        map.setView(center, 13);
        latInput.value = center.lat.toFixed(6);
        lonInput.value = center.lng.toFixed(6);
    })
    .addTo(map);
}

window.addEventListener('load', load);