import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ReportComponent } from './report/report.component';
import { DailyDataComponent } from './daily-data/daily-data.component';
import { TotalComponent } from './total/total.component';
import { OfficeComponent } from './office/office.component';
import { VehicleComponent } from './vehicle/vehicle.component';
import { RepComponent } from './rep/rep.component';
import { SpliteComponent } from './splite/splite.component';
import { SharedModule } from '../shared/shared.module';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { CoreRoutingModule } from './core-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    HomeComponent,
    DashboardComponent,
    ReportComponent,
    DailyDataComponent,
    TotalComponent,
    OfficeComponent,
    VehicleComponent,
    RepComponent,
    SpliteComponent,
    HeaderComponent,
    FooterComponent,
    WelcomeComponent
  ],
  imports: [
    CommonModule,
    CoreRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ],
  exports: [
    HeaderComponent,
    FooterComponent
  ]
})
export class CoreModule { }
