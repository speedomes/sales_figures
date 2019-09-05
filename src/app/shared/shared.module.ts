import { NgModule } from '@angular/core';

import { MaterialModule } from './material/material.module';
import { SnackBarComponent } from './snack-bar/snack-bar.component';

@NgModule({
  declarations: [
    SnackBarComponent
  ],
  entryComponents: [
    SnackBarComponent
  ],
  exports: [
    MaterialModule,
    SnackBarComponent
  ]
})
export class SharedModule { }
