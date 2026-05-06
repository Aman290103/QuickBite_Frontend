import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  currentLocation = signal<{lat: number, lon: number}>({ lat: 28.6139, lon: 77.2090 }); // Default to Delhi
  address = signal<string>('Detecting location...');

  constructor() {
    this.detectLocation();
  }

  detectLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          this.currentLocation.set({ lat, lon });
          
          // Advanced Mock Geocoding
          if (lat > 28.4 && lat < 28.8 && lon > 77.0 && lon < 77.4) {
            this.address.set('Connaught Place, New Delhi');
          } else if (lat > 18.8 && lat < 19.2 && lon > 72.7 && lon < 73.1) {
            this.address.set('Colaba, Mumbai');
          } else if (lat > 12.8 && lat < 13.2 && lon > 77.4 && lon < 77.8) {
            this.address.set('Indiranagar, Bengaluru');
          } else if (lat > 27.4 && lat < 27.8 && lon > 77.4 && lon < 77.8) {
            this.address.set('Krishna Nagar, Mathura');
          } else if (lat > 22.4 && lat < 22.8 && lon > 88.2 && lon < 88.6) {
            this.address.set('Park Street, Kolkata');
          } else if (lat > 17.2 && lat < 17.6 && lon > 78.3 && lon < 78.7) {
            this.address.set('Banjara Hills, Hyderabad');
          } else {
            this.address.set('Your Current Location');
          }
        },
        (error) => {
          console.error('Error detecting location:', error);
          this.address.set('New Delhi, India (Default)');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      this.address.set('New Delhi, India (Default)');
    }
  }

  setAddress(newAddress: string) {
    this.address.set(newAddress);
  }
}
