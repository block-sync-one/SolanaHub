import { Component, OnInit, TemplateRef, ViewChild, computed, signal } from '@angular/core';
import { IonRow, IonCol, IonSpinner, IonContent, IonGrid, IonHeader, IonButtons, IonMenuButton, IonToolbar, IonTitle, IonIcon, IonImg, IonButton } from '@ionic/angular/standalone';
import { PortfolioService, SolanaHelpersService } from 'src/app/services';
import { AirdropsFinderService } from 'src/app/services/airdrops-finder.service';
import { PageHeaderComponent } from 'src/app/shared/components/page-header/page-header.component';
import { MftModule } from 'src/app/shared/layouts/mft/mft.module';
import { addIcons } from 'ionicons';
import { peopleCircleOutline, checkmarkCircleOutline, closeCircleOutline, copyOutline, wallet } from 'ionicons/icons';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { TooltipModule } from 'src/app/shared/layouts/tooltip/tooltip.module';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-airdrop-finder',
  templateUrl: './airdrop-finder.page.html',
  styleUrls: ['./airdrop-finder.page.scss'],
  standalone: true,
  imports: [
    DatePipe,
    IonButton, 

    CurrencyPipe,
    DecimalPipe,
    IonImg,
    IonIcon,
    MftModule,
    PageHeaderComponent,
    IonRow,
    IonCol,
    IonSpinner,
    IonContent,
    IonGrid,
    IonHeader,
    IonButtons,
    IonMenuButton,
    IonToolbar,
    IonTitle,
    TooltipModule
  ]
})
export class AirdropFinderPage implements OnInit {
  @ViewChild('providerTpl', { static: true }) providerTpl: TemplateRef<any> | any;
  @ViewChild('datesTpl', { static: true }) datesTpl: TemplateRef<any> | any;
  
  //
  @ViewChild('tokenTpl', { static: true }) tokenTpl: TemplateRef<any> | any;
  @ViewChild('amountTpl', { static: true }) amountTpl: TemplateRef<any> | any;
  @ViewChild('valueTpl', { static: true }) valueTpl: TemplateRef<any> | any;
  @ViewChild('claimStatusTpl', { static: true }) claimStatusTpl: TemplateRef<any> | any;
  @ViewChild('platformIconTpl', { static: true }) platformIconTpl: TemplateRef<any> | any;
  @ViewChild('pointsTpl', { static: true }) pointsTpl: TemplateRef<any> | any;
  constructor(
    private _shs: SolanaHelpersService,
    private _afs: AirdropsFinderService,
    private _portfolio: PortfolioService,
  ) {
    addIcons({ peopleCircleOutline, checkmarkCircleOutline, closeCircleOutline, copyOutline });
  }

  private _airdropData = signal(null)
  public selectedTab = signal('Airdrops');
  // public tableMenuOptions: string[] = ['Airdrops', 'Points'];
  public columns = computed(() => {
    //@ts-ignore
    return this._columnsOptions[this.selectedTab().toLowerCase()]
  })
  public tableData = computed(() => {
    if (this._airdropData()) {

      let tableType: string = this.selectedTab().toLowerCase();

      return this._airdropData()[tableType]
    }
  })
  private _columnsOptions = null


  async getAirdrops() {
    console.log('getAirdrops');
    const { publicKey } = this._shs.getCurrentWallet()
    const airdrops = await this._afs.getWalletAirdrops(publicKey.toBase58())
    console.log('airdrops', airdrops);
    const data = { airdrops: airdrops.airdrops, points: airdrops }
    // const platforms = await this._portfolio.getPlatformsData();
    // data.airdrops = data.airdrops.map(ad => {
    //   ad.stage = ad.stage.replaceAll("_", " ")
    //   return { ...ad }
    // })
    // data.points = data.points.map(pts => {
    //   const platform = platforms.find(p => p.name.toLowerCase() === pts.protocol);
    //   pts.stage = pts.stage.replaceAll("_", " ")
    //   return { ...pts, ...platform }
    // })


    this._airdropData.set(data)
  }

  async ngOnInit() {
    this._columnsOptions = {
      airdrops: [
        { key: 'provider', title: 'Provider', cellTemplate: this.providerTpl, cssClass: { name: 'ion-text-center', includeHeader: true } },
        { key: 'dates', title: 'Claim open',cellTemplate: this.datesTpl,  cssClass: { name: 'ion-text-center', includeHeader: true } },
        { key: 'symbol', title: 'Symbol', cellTemplate: this.tokenTpl, cssClass: { name: 'ion-text-center', includeHeader: true } },
        { key: 'amount', title: 'Amount',cellTemplate: this.amountTpl,  cssClass: { name: 'ion-text-center', includeHeader: true } },
        { key: 'value', title: 'Value',  cellTemplate: this.valueTpl, cssClass: { name: 'ion-text-center', includeHeader: true } },
        { key: 'link', title: 'Link', cellTemplate:this.claimStatusTpl,  cssClass: { name: 'ion-text-center', includeHeader: true } },
           ],
      // points: [
      //   { key: 'points', title: 'Points', cellTemplate: this.pointsTpl, cssClass: { name: 'ion-text-center', includeHeader: true } },
      //   { key: 'stage', title: 'Stage', cssClass: { name: 'ion-text-center', includeHeader: true } },
      //   { key: 'protocol', title: 'Platform', cellTemplate: this.platformIconTpl, cssClass: { name: 'ion-text-center', includeHeader: true } },

      // ]
    }
    this.getAirdrops()


  }



}
