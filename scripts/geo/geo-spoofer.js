import { GeoSpoofSettings } from './geo-spoof-settings.js';

export class GeoSpoofer {
    constructor() {
        this.origGetCurrentPosition = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
        this.origWatchPosition = navigator.geolocation.watchPosition.bind(navigator.geolocation);
        this.settings = null;
    }

    spoofedPosition(success, error, options) {
        if (!this.settings) return;
        success({
            coords: {
                latitude: this.settings.lat,
                longitude: this.settings.lon,
                accuracy: 10,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null
            },
            timestamp: Date.now()
        });
    }

    async override() {
        this.settings = await GeoSpoofSettings.fetch();
        if (!this.settings || !this.settings.enabled) return;

        navigator.geolocation.getCurrentPosition = (success, error, options) => {
            this.spoofedPosition(success, error, options);
        };

        navigator.geolocation.watchPosition = (success, error, options) => {
            const id = setInterval(() => {
                this.spoofedPosition(success, error, options);
            }, 1000);
            return id;
        };
    }
}