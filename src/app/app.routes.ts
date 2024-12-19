import { Routes } from '@angular/router';
import { PageElementCraftComponent } from './pages/page-element-craft/page-element-craft.component';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: PageElementCraftComponent },
    { path: '**', redirectTo: 'home' }
];
