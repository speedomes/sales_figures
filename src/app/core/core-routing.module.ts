import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './home/home.component';
import { ReportComponent } from './report/report.component';
import { DailyDataComponent } from './daily-data/daily-data.component';
import { TotalComponent } from './total/total.component';
import { OfficeComponent } from './office/office.component';
import { VehicleComponent } from './vehicle/vehicle.component';
import { RepComponent } from './rep/rep.component';
import { SpliteComponent } from './splite/splite.component';


const routes: Routes = [
  { path: '', component: HomeComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'report', component: ReportComponent },
      { path: 'daily-data', component: DailyDataComponent },
      { path: 'total', component: TotalComponent },
      { path: 'office', component: OfficeComponent },
      { path: 'vehicle', component: VehicleComponent },
      { path: 'rep', component: RepComponent },
      { path: 'splite', component: SpliteComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CoreRoutingModule { }