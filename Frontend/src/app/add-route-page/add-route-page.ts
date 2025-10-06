import { Component, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import Papa from 'papaparse';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-add-route-page',
  imports: [

  ],
  templateUrl: './add-route-page.html',
  styleUrl: './add-route-page.css'
})
export class AddRoutePage implements AfterViewInit {
  private parsedRows: any[] = [];
  showBackModal = false;
  constructor(private router: Router) {}

  onBack(event: Event) {
    event.preventDefault();
    const startInput = (document.getElementById('startPointInput') as HTMLInputElement)?.value.trim();
    const fileInput = (document.getElementById('csvFileInput') as HTMLInputElement)?.value.trim();
    if (startInput || fileInput) {
      this.showBackModal = true;
    } else {
      this.router.navigate(['/']);
    }
  }

  confirmBack() {
    this.showBackModal = false;
    this.router.navigate(['/']);
  }

  cancelBack() {
    this.showBackModal = false;
  }

  ngAfterViewInit() {
    const map = L.map('map').setView([51.1657, 10.4515], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const input = document.getElementById('csvFileInput') as HTMLInputElement;
    input.addEventListener('change', (event: any) => {
      const file = event.target.files[0];
      if (!file) return;
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          this.parsedRows = results.data;
        }
      });
    });

    const showRouteBtn = document.getElementById('showRouteBtn') as HTMLButtonElement;
    showRouteBtn.addEventListener('click', async () => {
      // Clear map layers except base
      map.eachLayer(layer => {
        if ((layer as any).options && !(layer as any).options.attribution) {
          map.removeLayer(layer);
        }
      });
      // Base layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
      }).addTo(map);

      const startInput = document.getElementById('startPointInput') as HTMLInputElement;
      const startAddress = startInput.value.trim();
      if (!startAddress) {
        alert('Please enter a starting point address.');
        return;
      }
      // Geocode starting point
      const startGeoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startAddress)}`;
      const startGeoRes = await fetch(startGeoUrl);
      const startGeoData = await startGeoRes.json();
      if (!startGeoData || startGeoData.length === 0) {
        alert('Could not geocode starting point address.');
        return;
      }
      const startCoords = {
        lat: parseFloat(startGeoData[0].lat),
        lon: parseFloat(startGeoData[0].lon)
      };
      L.marker([startCoords.lat, startCoords.lon], {icon: L.icon({iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', iconAnchor: [12, 41], popupAnchor: [1, -34]})}).addTo(map).bindPopup('Start: ' + startAddress).openPopup();
      map.setView([startCoords.lat, startCoords.lon], 8);

      // Geocode CSV addresses
      const addressCoordsList: {address: string, lat: number, lon: number, row: any, marker?: any}[] = [];
      for (const row of this.parsedRows) {
        const address = [
          row['Place'],
          row['Street Address'],
          row['City'],
          row['Postal Code'],
          row['Country']
        ].filter(Boolean).join(', ');
        if (!address) continue;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
        try {
          const response = await fetch(url);
          const data = await response.json();
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            const marker = L.marker([lat, lon]).addTo(map).bindPopup(address);
            addressCoordsList.push({address, lat, lon, row, marker});
          }
        } catch (e) {
          console.error('Geocoding failed for:', address, e);
        }
      }
      // Nearest-neighbor path routing
      let routeOrder = [];
      let current = {lat: startCoords.lat, lon: startCoords.lon, address: startAddress};
      let unvisited = [...addressCoordsList];
      while (unvisited.length > 0) {
        let nearest = null;
        let nearestIdx = -1;
        let minDuration = Infinity;
        for (let i = 0; i < unvisited.length; i++) {
          const addr = unvisited[i];
          const routeUrl = `https://router.project-osrm.org/route/v1/driving/${current.lon},${current.lat};${addr.lon},${addr.lat}?overview=false`;
          try {
            const res = await fetch(routeUrl);
            const data = await res.json();
            if (data.routes && data.routes.length > 0) {
              const duration = data.routes[0].duration;
              if (duration < minDuration) {
                minDuration = duration;
                nearest = addr;
                nearestIdx = i;
              }
            }
          } catch (e) {
            console.error('Routing failed for:', addr.address, e);
          }
        }
        if (nearest) {
          routeOrder.push(nearest);
          current = nearest;
          unvisited.splice(nearestIdx, 1);
        } else {
          // If routing fails, break to avoid infinite loop
          break;
        }
      }
      // Draw route on map
      let routeCoords: [number, number][] = [[startCoords.lat, startCoords.lon]];
      for (const addr of routeOrder) {
        routeCoords.push([addr.lat, addr.lon]);
      }
      if (routeCoords.length > 1) {
        L.polyline(routeCoords, {color: 'blue', weight: 4}).addTo(map);
      }
      // Mark order on pins
      for (let i = 0; i < routeOrder.length; i++) {
        routeOrder[i].marker.bindPopup(`<b>Stop ${i+1}</b>: ${routeOrder[i].address}`);
      }
      // Show overview in right order
      const overviewDiv = document.getElementById('routeOverview');
      if (overviewDiv) {
        let html = '<h2>Route Overview</h2><ol>';
        html += `<li><b>Start:</b> ${startAddress}</li>`;
        for (let i = 0; i < routeOrder.length; i++) {
          html += `<li><b>Stop ${i+1}:</b> ${routeOrder[i].address}</li>`;
        }
        html += '</ol>';
        overviewDiv.innerHTML = html;
      }
    });
  }
}
