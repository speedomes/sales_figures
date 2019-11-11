import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WelcomeComponent } from './core/welcome/welcome.component';
import { AuthGuard } from './core/auth-guard';

const routes: Routes = [
  { path: 'welcome', component: WelcomeComponent },
  { path: 'home', canActivate: [AuthGuard], loadChildren: () => import('./core/core.module').then(mod => mod.CoreModule) },
  { path: '**', redirectTo: 'welcome', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
