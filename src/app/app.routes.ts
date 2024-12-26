import { Routes } from '@angular/router';
import { PageElementCraftComponent } from './pages/page-element-craft/page-element-craft.component';
import { PageNotFoundComponent } from './pages/page-not-found/page-not-found.component';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: PageElementCraftComponent },
    { path: '**', component: PageNotFoundComponent }
];
