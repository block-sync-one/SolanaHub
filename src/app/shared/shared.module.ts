import { IonicModule } from "@ionic/angular";
import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { RouterModule } from "@angular/router";
// import pipes
import { FilterPipe, SafePipe, ReversePipe } from "./pipes";

// import componenets
import {
  DataBoxComponent,
  LogoComponent,
  AssetsBalanceComponent,
  GoBackBtnComponent,
  WalletConnectComponent,
  WalletAdapterOptionsComponent,
  WalletConnectedDropdownComponent,
  LoaderComponent,
  SelectBoxComponent,
  SelectItemComponent
} from "./components";

// // import directives
// import {
  
  // } from "./directives";
  
  import { QRCodeModule } from 'angularx-qrcode';
  
  // font awesome
  import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

  // toop tip
  import { TooltipModule } from 'ng2-tooltip-directive';
@NgModule({
  declarations: [
    FilterPipe,
    SafePipe,
    ReversePipe,
    ReversePipe,
    DataBoxComponent,
    LogoComponent,
    AssetsBalanceComponent,
    GoBackBtnComponent,
    WalletConnectComponent,
    WalletAdapterOptionsComponent,
    WalletConnectedDropdownComponent,
    LoaderComponent,
    SelectBoxComponent,
    SelectItemComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    FontAwesomeModule,
    IonicModule,
    QRCodeModule,
    TooltipModule,
    // BrowserAnimationsModule,
  ],
  exports: [
    FontAwesomeModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    IonicModule,
    QRCodeModule,
    RouterModule,
    FilterPipe,
    SafePipe,
    ReversePipe,
    DataBoxComponent,
    LogoComponent,
    AssetsBalanceComponent,
    GoBackBtnComponent,
    TooltipModule,
    WalletConnectComponent,
    WalletAdapterOptionsComponent,
    WalletConnectedDropdownComponent,
    LoaderComponent,
    SelectBoxComponent,
    SelectItemComponent
  ]
})
export class SharedModule {}