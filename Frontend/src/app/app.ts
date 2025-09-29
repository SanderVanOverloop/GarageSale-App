import { Component, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';
import Papa from 'papaparse';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [
    RouterOutlet
  ],
  styleUrl: './app.css'
})
export class App implements AfterViewInit {
  ngAfterViewInit() {
    // Initialize Leaflet map
    const map = L.map('map').setView([51.1657, 10.4515], 5); // Centered on Germany/UK
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Handle CSV upload
    const input = document.getElementById('csvFileInput') as HTMLInputElement;
    input.addEventListener('change', (event: any) => {
      const file = event.target.files[0];
      if (!file) return;
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: any) => {
          const rows = results.data;
          for (const row of rows) {
            // Build address from columns
            const address = [
              row['Place'],
              row['Street Address'],
              row['City'],
              row['Postal Code'],
              row['Country']
            ].filter(Boolean).join(', ');
            if (!address) continue;
            // Geocode address using Nominatim
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
            try {
              const response = await fetch(url);
              const data = await response.json();
              if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                L.marker([lat, lon]).addTo(map).bindPopup(address);
              }
            } catch (e) {
              console.error('Geocoding failed for:', address, e);
            }
          }
        }
      });
    });
  }
}
