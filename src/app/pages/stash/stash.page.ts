import { Component, ElementRef, OnInit, ViewChild, computed, signal } from '@angular/core';
import { IonRow, IonCol, IonContent, IonGrid, IonButton, IonImg, IonIcon, IonToggle, IonProgressBar, IonSkeletonText, IonLabel, IonChip, IonText, IonCheckbox } from '@ionic/angular/standalone';
import { SolanaHelpersService, UtilService } from 'src/app/services';
import { PageHeaderComponent, PortfolioBreakdownComponent } from 'src/app/shared/components';
import { PromoComponent } from './promo/promo.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { StashService } from './stash.service';
import { addIcons } from 'ionicons';
import { closeOutline, heartHalfOutline } from 'ionicons/icons';
import { ModalController } from '@ionic/angular';
import { FaqPopupComponent } from 'src/app/shared/components/faq-popup/faq-popup.component';
import { EarningComponent, TableComponent } from './';


@Component({
  selector: 'app-stash',
  templateUrl: './stash.page.html',
  styleUrls: ['./stash.page.scss'],
  standalone: true,
  animations: [
    trigger('slideInEnter', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)' }),
        animate('500ms ease-out', style({ transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('slideInLeave', [
      transition(":leave", [
        animate('500ms ease-out', style({ opacity: 0 })),
      ])
    ])
  ],
  imports: [
    EarningComponent,
    TableComponent,
    PortfolioBreakdownComponent,
    PromoComponent,
    IonButton,
    PageHeaderComponent,
    IonRow,
    IonContent,
    IonCol,
    IonGrid,
  ]
})
export class StashPage implements OnInit {
  @ViewChild('portfolioBreakdown', { static: false }) portfolioBreakdown: PortfolioBreakdownComponent;


  public analyzeStage = signal(0);
  public hideStash = signal(false)
  public selectedTab = signal('assets');


  constructor(
    private _stashService: StashService,
    private _modalCtrl: ModalController
  ) {
    addIcons({ heartHalfOutline, closeOutline });

  }

  public stashTotalUsdValue = computed(() => this.assets()?.filter(data => data.value).reduce((accumulator, currentValue) => accumulator + currentValue.value, 0))

  public unstakedOverflow = this._stashService.findStakeOverflow;
  public outOfRangeDeFiPositions = this._stashService.findOutOfRangeDeFiPositions;
  public zeroValueAssets = this._stashService.findZeroValueAssets;
  public dustValueTokens = this._stashService.findDustValueTokens;


  // append unstakedOverflow & zeroYieldZones & dustBalanceAccounts & outOfRangeDeFiPositions once they are computed
  public assets = computed(() => {
    if (!(this.unstakedOverflow() || this.outOfRangeDeFiPositions() || this.dustValueTokens() || this.zeroValueAssets())) return []
    const assets = []

    if (this.unstakedOverflow()) {
      assets.push(this.unstakedOverflow())
    }
    if (this.outOfRangeDeFiPositions()) {
      assets.push(this.outOfRangeDeFiPositions())
    }
    if (this.dustValueTokens()) {
      assets.push(this.dustValueTokens())
    }
    if (this.zeroValueAssets()) {
      assets.push(this.zeroValueAssets())
    }


    return assets.sort((a, b) => {
      const valueA = a.value || 0;
      const valueB = b.value || 0;
      return valueB - valueA;
    });
  })

  async ngOnInit() {

    // this.unstakedOverflow = await this._stashService.findExtractAbleSOLAccounts()
  }
  async getSavingData() {
    const minLoadingTime = 3000

    setTimeout(() => {
      const interval = setInterval(() => {
        if (this.assets().length > 0) {
          clearInterval(interval)
          this.analyzeStage.set(1)
        }
      }, 500);
    }, minLoadingTime);

  }


  public async openFaqPopOver() {
    const modal = await this._modalCtrl.create({
      component: FaqPopupComponent,
      cssClass: 'faq-modal',
      componentProps: {
        title: 'How it works',
        desc: `Stash page is created from the deep understanding of the Solana ecosystem. <br>
        It is designed to find asset in different source, where every source has its own way to extract value.`,
        faq: [
          {
            "id": 1,
            "question": "What is the purpose of the Stash page?",
            "answer": "The Stash page is designed to help you uncover and reclaim value from idle or underutilized assets in your Solana wallet. These assets may include small balances, unproductive tokens, or other items that you may have forgotten about or didn't realize held potential value. The Stash page simplifies the process of managing these resources, helping you optimize your portfolio and get more out of your holdings."
          },
          {
            "id": 2,
            "question": "Where is the extractable value found?",
            "answer": "Extractable value is located across various sources within your Solana wallet. Each source represents a unique category of assets, such as dust balances, unused liquidity positions, or excessive stake rewards. The Stash page dives deep into these categories, helping you identify and reclaim value by looping through and analyzing assets that might otherwise remain unutilized."
          },
          {
            "id": 3,
            "question": "What does Dust Value mean and how do you handle it?",
            "answer": "Dust Value refers to small amounts of assets, typically those valued at less than 3% of your total portfolio. These amounts can clutter your wallet and are often overlooked. By default, Stash identifies these as 'dust,' but you can adjust this threshold to suit your preferences. Stash also provides a bulk-swap feature, enabling you to combine and swap multiple dust assets into a more valuable or usable form in one streamlined process."
          },
          {
            "id": 4,
            "question": "What is excessive balance on stake accounts?",
            "answer": "Excessive balances on stake accounts often arise from rewards generated by your staked tokens, such as MEV (Maximal Extractable Value) rewards. These rewards accumulate over time but are not automatically reinvested or compounded. This is particularly relevant for native SOL stakers. The Stash page highlights these excess balances, allowing you to reclaim to your wallet easily."
          },
          {
            "id": 5,
            "question": "What do 'out of range' DeFi positions mean?",
            "answer": "'Out of range' DeFi positions occur when the current price of an asset moves outside the range you selected while providing liquidity. In this situation, your liquidity is no longer earning fees and is effectively idle. Stash identifies these positions across platforms like Meteora, Raydium, and Orca, so you can withdraw your liquidity and reclaim your assets."
          },
          {
            "id": 6,
            "question": "What does Zero Value Asset mean?",
            "answer": "Zero Value Assets are tokens or NFTs that currently have no market value or empty accounts. While they may seem worthless, they often occupy rent-paying accounts. Stash allows you to extract value from these assets by burning them and reclaiming the associated rent fees."
          },
          {
            "id": 7,
            "question": "Is Stash a smart contract?",
            "answer": "No, Stash is not a smart contract. Instead, it leverages Solana native programs and integrates with other protocols to analyze and manage your wallet's idle assets. This approach ensures that you maintain full control over your assets while benefiting from Stash's ability to locate and optimize unused resources."
          },
          {
            "id": 8,
            "question": "What are the risks of using Stash?",
            "answer": "Stash operates in a 'safe mode' by default, meaning it excludes unknown or potentially valuable assets from its suggestions. However, there is still some risk. For example, certain assets might appear valueless, like NFTs with no floor price or tokens with no active market, but they could hold hidden value. If you burn or swap such assets, you might unknowingly lose something valuable. It's essential to review all recommendations carefully and understand the implications before taking action."
          },
          {
            "id": 9,
            "question": "Do I need to pay for using Stash?",
            "answer": "Yes, there is a simple fee structure for using Stash. For most operations, we charge a flat 5% fee based on the value of the transaction. However, for identifying and managing 'out of range' DeFi positions, there is a fixed fee of 0.01 SOL per position. This pricing ensures transparency while allowing us to maintain and improve the service for all users."
          }
          
        ]
        
      }
    })
    modal.present()
  }


}
