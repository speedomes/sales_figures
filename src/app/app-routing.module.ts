import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WelcomeComponent } from './core/welcome/welcome.component';
import { HomeComponent } from './core/home/home.component';
import { CoreModule } from './core/core.module';


const routes: Routes = [
  { path: 'welcome', component: WelcomeComponent },
  { path: 'home', loadChildren: () => import('./core/core.module').then(mod => mod.CoreModule) },
  { path: '**', redirectTo: 'welcome', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
