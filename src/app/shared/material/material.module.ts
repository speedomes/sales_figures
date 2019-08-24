import { NgModule } from '@angular/core';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  exports: [
    MatSidenavModule,
    MatButtonModule
  ]
})
export class MaterialModule { }
