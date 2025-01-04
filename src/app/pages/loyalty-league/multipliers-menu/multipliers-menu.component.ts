import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { IonMenu, IonImg, IonText, IonLabel, IonChip, IonSkeletonText, IonIcon } from '@ionic/angular/standalone';
import { TooltipModule } from 'src/app/shared/layouts/tooltip/tooltip.module';
import { animate, style, transition, trigger } from '@angular/animations';
import { LoyaltyLeagueService } from 'src/app/services/loyalty-league.service';
import { Multipliers } from 'src/app/models';
import { AsyncPipe, DecimalPipe, JsonPipe, KeyValuePipe } from '@angular/common';
import { addIcons } from 'ionicons';
import { diamondOutline, flash, flashOutline, linkOutline } from 'ionicons/icons';
import { TooltipPosition } from 'src/app/shared/layouts/tooltip/tooltip.enums';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { AnimatedIconComponent } from 'src/app/shared/components';
import va from '@vercel/analytics'; 
@Component({
  selector: 'multipliers-menu',
  templateUrl: './multipliers-menu.component.html',
  styleUrls: ['./multipliers-menu.component.scss'],
  standalone: true,
  imports: [
    AnimatedIconComponent,
    IonIcon,
    ChipComponent, 
    IonSkeletonText,
    TooltipModule,
    IonChip,
    IonLabel,
    IonText,
    IonImg,
    DecimalPipe,
    IonIcon
  ],
  animations: [
    trigger('menuAnimation', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-in-out', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in-out', style({ transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class MultipliersMenuComponent implements OnInit {
  @Output() menuToggle = new EventEmitter();
  tooltipPosition = TooltipPosition.LEFT;
  public defaultMultipliers = {
    LSTs: [
      {
        img: 'assets/images/sol.svg',
        title: 'SOL',
        pts: 0,
      },
      {
        img: 'assets/images/hubSOL.svg',
        title: 'hubSOL',
        pts: 0,
      },
      {
        img: 'assets/images/vSOL.svg',
        title: 'vSOL',
        pts: 0,
      },
      {
        img: 'assets/images/bSOL.svg',
        title: 'bSOL',
        pts: 0,
      }
    ],
    daoTokens: [
   
      {
        img: 'assets/images/BLZE.svg',
        title: 'veBLZE',
        pts: 0,
      }
    ],
    hubSOLBoosters: [
      {
        img: 'assets/images/ll/save.png',
        title: 'save',
        pts: 2,
        link: 'https://save.finance/dashboard',
        badges: [{ strategy: 'lending', protocolBoosted: false, solanahubboosted: false }]
      },
      {
        img: 'assets/images/ll/nx-finance.svg',
        title: 'NX finance',
        pts: 'up to 10x',
        link: 'https://nxfinance.io/leverage/v2/hubSOL',
        badges: [{ strategy: 'Multiply', protocolBoosted: false, solanahubboosted: false }]
      },
      {
        img: 'assets/images/ll/loopscale.png',
        title: 'loopscale',
        pts: 'up to 4x',
        link: 'https://app.loopscale.com/earn',
        badges: [{ strategy: 'Multiply', protocolBoosted: false, solanahubboosted: false }]
      },
      {
        img: 'assets/images/ll/orca.svg',
        title: 'orca',
        pts: 1.5,
        link: 'https://www.orca.so/pools?tokens=HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX',
        badges: [{ strategy: 'Liquidity pools', protocolBoosted: true, solanahubboosted: false }]
      },
      {
        img: 'assets/images/ll/kamino.svg',
        title: 'kamino',
        pts: 'up to 5x',
        link: 'https://app.kamino.finance',
        badges: [{ strategy: 'all products', protocolBoosted: false, solanahubboosted: true }]

      },
      {
        img: 'assets/images/ll/meteora.svg',
        title: 'meteora',
        pts: 1.5,
        link: 'https://app.meteora.ag',
        badges: [{ strategy: 'Liquidity pools', protocolBoosted: false, solanahubboosted: true }]

      },


      {
        img: 'assets/images/ll/raydium.svg',
        title: 'raydium',
        pts: 1.5,
        link: 'https://raydium.io/liquidity-pools/?token=HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX',
        badges: [{ strategy: 'Liquidity pools', protocolBoosted: false, solanahubboosted: false }]

      },

      {
        img: 'assets/images/ll/solayer.svg',
        title: 'solayer',
        pts: 1.2,
        link: 'https://app.solayer.org/dashboard',
        badges: [{ strategy: 'Restaking', protocolBoosted: false, solanahubboosted: false }]

      },

      // {
      //   img: 'assets/images/ll/texture.svg',
      //   title: 'texture',
      //   pts: 0,
      //   link: 'https://texture.finance/lendy/lend',
      //   badges: [{ strategy: 'P2P Lending', protocolBoosted: false, solanahubboosted: false }]
      // },

      {
        img: 'assets/images/ll/rainfi.svg',
        title: 'rainfi',
        pts: 1.2,
        link: 'https://rain.fi/swap/hubSOL-SOL',
        badges: [{ strategy: 'P2P Lending', protocolBoosted: false, solanahubboosted: false }]
      },
    ]
  }
  private multipliersFetched = inject(LoyaltyLeagueService).getBoosters()

  ngOnInit(): void {
    va.track('loyalty league', { event: 'multipliers menu open' })
    this.updateMultipliers()
  }
  constructor() {
    addIcons({diamondOutline,linkOutline,flash,flashOutline});
  }
  async updateMultipliers() {

    const fetchedMultipliers = await this.multipliersFetched

    this.defaultMultipliers = {
      LSTs: [
        {
          img: 'assets/images/sol.svg',
          title: 'SOL',
          pts: fetchedMultipliers.SOL,
        },
        {
          img: 'assets/images/hubSOL.svg',
          title: 'hubSOL',
          pts: fetchedMultipliers.hubSOL,
        },
        {
          img: 'assets/images/vSOL.svg',
          title: 'vSOL',
          pts: fetchedMultipliers.vSOL,
        },
        {
          img: 'assets/images/bSOL.svg',
          title: 'bSOL',
          pts: fetchedMultipliers.bSOL,
        }
      ],
      daoTokens: [
        {
          img: 'assets/images/BLZE.svg',
          title: 'veBLZE',
          pts: fetchedMultipliers.veBLZE,
        }
      ],
      hubSOLBoosters: this.defaultMultipliers.hubSOLBoosters
       // .sort((a: any, b: any) => b.pts - a.pts)
    };
  }
  dismissModal(event: any) {
    console.log('dismissModal', event)
    this.menuToggle.emit()
  }
  defiSafetyTips = [
    'Do your own research before participating in DeFi projects',
    'All of those DeFi projects are independent entities, SolanaHub is not affiliated with any of them',
    'Understand liquidity risks, including slippage, impermanent loss, and other risks',
    'Yield farming and staking carries risks, including potential rewards and losses',
    'Make sure to check a platform has an Audit done'
  ]
}
