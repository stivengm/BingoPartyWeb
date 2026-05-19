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
        path: 'create_room',
        loadComponent: () => import('./features/create-room/create-room').then(m => m.CreateRoom)
    },
    {
        path: 'login_room',
        loadComponent: () => import('./features/login-room/login-room').then(m => m.LoginRoom)
    },
    {
        path: 'lobby',
        loadComponent: () => import('./features/lobby/lobby').then(m => m.Lobby)
    },
    {
        path: 'game_curse',
        loadComponent: () => import('./features/game/game').then(m => m.Game)
    },
    {
        path: '**',
        redirectTo: 'welcome_view'
    }
];
