import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-page',
  imports: [
    RouterLink
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomePage {
  savedRoutes: any[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.loadSavedRoutes();
  }

  loadSavedRoutes() {
    const routes = localStorage.getItem('garageRoutes');
    this.savedRoutes = routes ? JSON.parse(routes) : [];
  }

  openRoute(routeId: string) {
    this.router.navigate(['/addmap'], { queryParams: { routeId: routeId } });
  }

  deleteRoute(routeId: string, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this route?')) {
      this.savedRoutes = this.savedRoutes.filter(route => route.id !== routeId);
      localStorage.setItem('garageRoutes', JSON.stringify(this.savedRoutes));
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
