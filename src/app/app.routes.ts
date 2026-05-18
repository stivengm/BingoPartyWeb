import { Routes } from '@angular/router';
import { WelcomeView } from './features/welcome-view/welcome-view';


export const routes: Routes = [
    {
        path: '',
        redirectTo: 'welcome_view',
        pathMatch: 'full'
    },
    {
        path: 'welcome_view',
        component: WelcomeView
    },
    {
        path: '**',
        redirectTo: 'welcome_view'
    }
];
