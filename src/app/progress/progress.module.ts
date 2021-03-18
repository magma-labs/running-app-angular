import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ProgressPage } from './progress.page';

import { ProgressPageRoutingModule } from './progress-routing.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProgressPageRoutingModule
  ],
  declarations: [ProgressPage]
})
export class ProgressPageModule {}
