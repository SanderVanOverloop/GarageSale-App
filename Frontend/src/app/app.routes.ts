import { Routes } from '@angular/router';
import { AddRoutePage } from './add-route-page/add-route-page';
import { HomePage } from './home-page/home-page';

export const routes: Routes = [
  { path: '', component: HomePage },
  { path: 'addmap', component: AddRoutePage },
];
