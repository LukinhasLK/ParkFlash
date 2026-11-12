import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app/dashboard' },

  {
    path: 'login',
    canActivate: [guestGuard],
    title: 'Entrar · ParkFlash',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },

  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/app-layout/app-layout.component').then((m) => m.AppLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        title: 'Dashboard · ParkFlash',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'fichas',
        canActivate: [roleGuard],
        title: 'Fichas · ParkFlash',
        loadComponent: () => import('./features/fichas/fichas-list/fichas-list.component').then((m) => m.FichasListComponent),
      },
      {
        path: 'fichas/nova',
        canActivate: [roleGuard],
        title: 'Nova ficha · ParkFlash',
        loadComponent: () => import('./features/fichas/nova-ficha/nova-ficha.component').then((m) => m.NovaFichaComponent),
      },
      {
        path: 'fichas/:id/editar',
        canActivate: [roleGuard],
        title: 'Editar ficha · ParkFlash',
        loadComponent: () => import('./features/fichas/nova-ficha/nova-ficha.component').then((m) => m.NovaFichaComponent),
      },
      {
        path: 'relatorios',
        canActivate: [roleGuard],
        title: 'Relatórios · ParkFlash',
        loadComponent: () => import('./features/relatorios/relatorios.component').then((m) => m.RelatoriosComponent),
      },
      {
        path: 'manobristas',
        canActivate: [roleGuard],
        title: 'Manobristas · ParkFlash',
        loadComponent: () => import('./features/manobristas/manobristas.component').then((m) => m.ManobristasComponent),
      },
      {
        path: 'divisao-lucro',
        canActivate: [roleGuard],
        title: 'Divisão de Lucro · ParkFlash',
        loadComponent: () => import('./features/divisao-lucro/divisao-lucro.component').then((m) => m.DivisaoLucroComponent),
      },
      {
        path: 'despesas',
        canActivate: [roleGuard],
        title: 'Despesas · ParkFlash',
        loadComponent: () => import('./features/despesas/despesas.component').then((m) => m.DespesasComponent),
      },
      {
        path: 'carros-por-mes',
        canActivate: [roleGuard],
        title: 'Carros por Mês · ParkFlash',
        loadComponent: () => import('./features/carros-por-mes/carros-por-mes.component').then((m) => m.CarrosPorMesComponent),
      },
      {
        path: 'unidades',
        canActivate: [roleGuard],
        title: 'Unidades · ParkFlash',
        loadComponent: () => import('./features/unidades/unidades.component').then((m) => m.UnidadesComponent),
      },
      {
        path: 'socios',
        canActivate: [roleGuard],
        title: 'Sócios · ParkFlash',
        loadComponent: () => import('./features/socios/socios.component').then((m) => m.SociosComponent),
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard],
        title: 'Usuários · ParkFlash',
        loadComponent: () => import('./features/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
      },
      {
        path: 'perfil',
        canActivate: [roleGuard],
        title: 'Meu perfil · ParkFlash',
        loadComponent: () => import('./features/perfil/perfil.component').then((m) => m.PerfilComponent),
      },
    ],
  },

  { path: '**', redirectTo: 'app/dashboard' },
];
