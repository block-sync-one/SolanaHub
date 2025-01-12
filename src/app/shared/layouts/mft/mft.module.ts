import { NgModule } from '@angular/core';

import { IonImg, IonButton, IonSearchbar, IonSpinner, IonRow, IonCol, IonCheckbox, IonIcon } from '@ionic/angular/standalone';
import { TableModule } from 'ngx-easy-table';
import { CurrencyPipe, DecimalPipe, JsonPipe, KeyValuePipe } from '@angular/common';

import { MftComponent } from './mft.component';
import { SearchBoxComponent } from '../../components/search-box/search-box.component';
import { TableHeadComponent } from './table-head/table-head.component';
import { TableMenuComponent } from './table-menu/table-menu.component';

@NgModule({
  declarations: [MftComponent],
  imports: [JsonPipe,
    KeyValuePipe,
    TableModule,
    TableHeadComponent,
    TableMenuComponent,
    IonCheckbox,
    SearchBoxComponent,
    IonRow, IonCol,
    IonImg,
    IonSearchbar,
    CurrencyPipe,
    DecimalPipe,
    IonButton,
    IonSpinner,
    IonIcon
  ],
  exports: [MftComponent,]
})
export class MftModule { }
