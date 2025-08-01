import { CommonModule, DOCUMENT, NgStyle } from '@angular/common';
import {
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  ElementRef,
  Inject,
  OnInit,
  Renderer2,
  ViewChild,
  signal,
  inject, computed
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonImg,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonListHeader,
  IonMenuToggle,
  IonItem,
  IonLabel,
  IonRouterOutlet,
  IonChip,
  IonHeader,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, diamond, images, fileTrayFull, notifications, barcode, cog, swapHorizontal, chevronDownOutline, logoDiscord, logoGithub } from 'ionicons/icons';
import { ModalController } from '@ionic/angular';


import { WalletStore } from '@heavy-duty/wallet-adapter';
import { WalletModule } from './shared/layouts/wallet/wallet.module';
import { TurnstileCaptchaComponent, MenuComponent, AnimatedIconComponent, SettingsButtonComponent } from './shared/components';
import { NotConnectedComponent } from './shared/layouts/not-connected/not-connected.component';
import { VirtualStorageService } from './services/virtual-storage.service';

import { PortfolioService, UtilService, WatchModeService } from './services';
import { RoutingPath } from "./shared/constants";

import { combineLatestWith, filter, switchMap, map, of, tap, take } from 'rxjs';
import { NotificationsService } from './services/notifications.service';

import { NewsFeedComponent } from './shared/components/news-feed/news-feed.component';

import { CaptchaService } from './services/captcha.service';
import {FreemiumService} from "@app/shared/layouts/freemium";
import { StakeService } from './pages/staking/stake.service';
import { FreemiumModule } from './shared/layouts/freemium/freemium.module';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    TurnstileCaptchaComponent,
    SettingsButtonComponent,
    MenuComponent,
    IonHeader,
    IonImg,
    AnimatedIconComponent,
    IonChip,
    WalletModule,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonListHeader,
    IonMenuToggle,
    IonItem,
    IonLabel,
    IonRouterOutlet,
    IonImg,
    IonIcon,
    NotConnectedComponent,
    FreemiumModule
  ],
})
export class AppComponent implements OnInit {
  readonly watchMode$ = this._watchModeService.watchMode$
  readonly isReady$ = this._walletStore.connected$.pipe(
    combineLatestWith(this.watchMode$),
    switchMap(async ([wallet, watchMode]) => {
    
      if(wallet){
        this.isWalletConnected.set(true);

        setTimeout(() => {
          this._notifService.checkAndSetIndicator()

        });
      } else {
        this.isWalletConnected.set(false)
      }
      

   
      return wallet || watchMode;
    }))

  public notifIndicator = this._notifService.notifIndicator;
  public hubSOLpoolIndicator = this._stakingService.hubSOLpool;
  public isCaptchaVerified$ = this._captchaService.captchaVerified$;
  public adShouldShow = computed(() => this.isWalletConnected() && this._freemiumService.isAdEnabled());
  public isWalletConnected = signal(false);

  constructor(
    private activeRoute: ActivatedRoute,
    public router: Router,
    private _captchaService: CaptchaService,
    private _notifService: NotificationsService,
    private _watchModeService: WatchModeService,
    private _modalCtrl: ModalController,
    private _walletStore: WalletStore,
    private _vrs: VirtualStorageService,
    private _utilService: UtilService,
    private _freemiumService: FreemiumService,
    private _renderer: Renderer2,
    private _stakingService: StakeService,
    private _portfolioService: PortfolioService,
    @Inject(DOCUMENT) private document: Document,
  ) {
    const showNewsFeed = JSON.parse(this._vrs.localStorage.getData('newsFeedClosed'))
    // check if news feed was closed more than 30 days ago
    if(!showNewsFeed || new Date(showNewsFeed.date).getTime() < Date.now() - 30 * 24 * 60 * 60 * 1000){
      this.openNewsFeedModal()
    }

    addIcons({ home, diamond, images, fileTrayFull, barcode, cog, swapHorizontal, chevronDownOutline, notifications, logoGithub, logoDiscord });
  }

  async openNewsFeedModal(){

    const modal = await this._modalCtrl.create({
      component: NewsFeedComponent,
      cssClass: 'news-feed-modal'
    });
    modal.present();
    modal.onDidDismiss().then(() => {
      this._vrs.localStorage.saveData('newsFeedClosed', JSON.stringify({date: new Date().toISOString()}))
    })
  }

  log(...args: any[]){
    console.log(...args);
  }

  async ngOnInit() {
  // createPhantom();
    // set stored theme
    this._renderer.addClass(this.document.body, this._utilService.theme + '-theme')


    // Replace the query params code with this
    this.activeRoute.queryParams.subscribe(async (params) => {
      if(params['watch']){
        this._walletStore.disconnect().subscribe();
        this._portfolioService.clearWallet()

        // redirect to overview
        this.router.navigate([`/${RoutingPath.OVERVIEW}`], { 
          queryParamsHandling: 'preserve'  // Use this instead of queryParams
        });
        // set watch mode
        this._watchModeService.checkAndSetWatchMode(params['watch'])
      }
    });
  }

  public SolanaHubLogo = 'assets/images/solanahub-logo.png';

  public appPages = [
    {
      // group: 'Portfolio',
      pages: [
        {
          title: 'Overview',
          url: `/${RoutingPath.OVERVIEW}`,
          icon: 'https://cdn.lordicon.com/mixcgtqu.json',
          active: true
        },
        {
          title: 'Collectibles',
          url: `/${RoutingPath.COLLECTIBLES}`,
          icon: 'https://cdn.lordicon.com/yvvkyhue.json',
          active: true
        },
        {
          title: 'Notifications',
          url: `/${RoutingPath.NOTIFICATIONS}`,
          icon: 'https://cdn.lordicon.com/vspbqszr.json',
          active: true
        }
      ],
    },
    {
      group: 'DeFi',
      pages: [
        // { title: 'Swap', url: `/${RoutingPath.SWAP}`, icon: 'https://cdn.lordicon.com/whczgeys.json', active: true },
        {
          title: 'Staking',
          url: `/${RoutingPath.STAKING}`,
          icon: 'https://cdn.lordicon.com/xoaqvsym.json',
          active: true
        },
        // {
        //   title: 'Lending',
        //   url: `/${RoutingPath.LENDING}`,
        //   icon: 'https://cdn.lordicon.com/jkgunhbs.json',
        //   active:  environment.production ? false : true
        // },
        {
          title: 'Stash',
          url: `/${RoutingPath.STASH}`,
          icon: 'https://cdn.lordicon.com/hpveozzh.json',
          active: true
        },
        { title: 'DAO', url: `/${RoutingPath.DAO}`, icon: 'https://cdn.lordicon.com/ivugxnop.json', active: true },
      ],
    },
    {
      group: 'Explore',
      pages: [
        {title: 'hubSOL', url: `/${RoutingPath.HUBSOL}`, icon: 'https://cdn.lordicon.com/uvscndge.json', active: true},

        { title: 'Bridge', url: `/${RoutingPath.BRIDGE}`, icon: 'https://cdn.lordicon.com/uvscndge.json', active: true },
        {
          title: 'Airdrops finder',
          url: `/${RoutingPath.AIRDROP_FINDER}`,
          icon: 'https://cdn.lordicon.com/unukghxb.json',
          active: true
        },
        // { title: 'Events', url: `/${RoutingPath.EVENTS}`, icon: 'https://cdn.lordicon.com/hffrpcip.json', active: false },
      ],
    },
  ];



}
