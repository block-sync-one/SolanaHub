import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { StashAsset } from '../stash.model';
import { IonLabel, IonText, IonImg, IonButton, IonSkeletonText, IonCheckbox } from '@ionic/angular/standalone';
import { KeyValuePipe } from '@angular/common';
import { StashService } from '../stash.service';
import { ModalController } from '@ionic/angular';
import { UtilService } from 'src/app/services/util.service';
import { LiquidStakeService } from 'src/app/services/liquid-stake.service';
import { EarningsService, HelpersService } from '../helpers';
import { AlertComponent } from 'src/app/shared/components/alert/alert.component';
import va from '@vercel/analytics'
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { LoyaltyLeagueService } from 'src/app/services/loyalty-league.service';
import { PlatformFeeComponent } from "@app/shared/components/platform-fee/platform-fee.component";
import {FreemiumService, ModalUpgradeMessageComponent} from "@app/shared/layouts/freemium";
import { PremiumActions } from "@app/enums";
import {IsPremiumServiceDirective} from "@app/shared/directives";

@Component({
  selector: 'stash-modal',
  templateUrl: './stash-modal.component.html',
  styleUrls: ['./stash-modal.component.scss'],
  standalone: true,
  providers: [

  ],
  imports: [IonCheckbox,
    AlertComponent,
    IonSkeletonText,
    IonButton,
    IonImg,
    IonText,
    IonLabel,
    KeyValuePipe, PlatformFeeComponent, IsPremiumServiceDirective, ModalUpgradeMessageComponent
  ]
})
export class StashModalComponent implements OnInit {
  @Input() stashAssets: StashAsset[] = [];
  @Input() actionTitle: string = ''
  @Input() swapTohubSOL: boolean = false;
  public burnWithCautionConfirmed = null;
  public extraWarning =null
  constructor(
    private _stashService: StashService,
    private _helpersService: HelpersService,
    public utils: UtilService,
    public modalCtrl: ModalController,
    private _lss: LiquidStakeService,
    private _earningsService: EarningsService,
    private _loyaltyLeagueService: LoyaltyLeagueService,
    private _freemiumService: FreemiumService
  ) {
  }

  public summary: { [key: string]: number } = {};
  public platformFeeInSOL = signal(0)
  public stashState = signal('')
  public hubSOLRate = null
  ngOnInit() {
    this.extraWarning = this.stashAssets[0].type == 'value-deficient' && this.stashAssets.filter(asset => asset.balance > 0).length > 0
    va.track('stash', {
      state: 'modal',
      action: 'modal opened',
      type: this.stashAssets[0].type,
      assets: this.stashAssets.length
    })
    if(this.stashAssets[0].type == 'value-deficient'){
      this.burnWithCautionConfirmed = false
    }
    if (this.swapTohubSOL) {
      this._fetchHubSOLRate()
    }
    this.stashState.set(this.actionTitle)
    console.log('stashAssets', this.stashAssets);


    // add 1% platform fee from total summery value
    this.summary = this.stashAssets.map(item => item.extractedValue).reduce((acc, item) => {
      Object.keys(item).forEach(key => {
        acc[key] = ((acc[key] || 0) + item[key]);

      });
      Object.keys(acc).forEach(key => {
        acc[key] = Number(acc[key])
      });

      return acc;
    }, {})
    // loop through summary and add toFixedNoRounding 2
    Object.keys(this.summary).forEach(key => {
      this.summary[key] = Number(this.summary[key]).toFixedNoRounding(5)
    })
    // filter zero values
    this.summary = Object.fromEntries(Object.entries(this.summary).filter(([key, value]) => value > 0))

    this._calculatePlatformFee()

    // if summary contain SOL, deduct platform fee
    if (this.summary['SOL']) {
      this.summary['SOL'] = this.summary['SOL'] - this.platformFeeInSOL()
    }
  }
  private async _fetchHubSOLRate() {
    try {
      const hubSOLratio = await fetch('https://extra-api.sanctum.so/v1/sol-value/current?lst=hubSOL')
      const hubSOLratioData = await hubSOLratio.json()
      const exchangeRate = hubSOLratioData.solValues.hubSOL / LAMPORTS_PER_SOL;
      this.hubSOLRate = exchangeRate
      return exchangeRate
    } catch (error) {
      console.log(error)
      return 0
    }
  }
  private _calculatePlatformFee() {
    const type = this.stashAssets[0].type
    switch (type) {
      case 'stake-account':
      case 'value-deficient':
      case 'dust-value':
        this.platformFeeInSOL.set(this._freemiumService.calculatePlatformFeeInSOL(PremiumActions.STASH, this.summary['SOL']));
        break
      case 'defi-position':
        this.platformFeeInSOL.set(this._freemiumService.calculatePlatformFeeInSOL(PremiumActions.STASH_OOR, this.stashAssets.length));
        break
    }
  }

  async submit(event: StashAsset[]) {
    va.track('stash', {
      state: 'modal',
      action: 'submit',
      type: event[0].type,
      assets: event.length
    })
    const { publicKey } = this._helpersService.shs.getCurrentWallet()
    const type = event[0].type

      this.stashState.set('preparing transactions')

    let signatures: string[] = []
    let dataToReload =''
    switch (type) {
      case 'stake-account':
        signatures = await this._stashService.withdrawStakeAccountExcessBalance(event, publicKey)
        dataToReload = 'stake'
        break
      case 'defi-position':
        signatures = await this._stashService.closeOutOfRangeDeFiPosition(event, publicKey)
        dataToReload = 'defi-position'
        break
      case 'value-deficient':
        signatures = await this._stashService.burnZeroValueAssets(event, publicKey)
        dataToReload = 'value-deficient'
        break
      case 'dust-value':
        signatures = await this._stashService.swapDustValueTokens(event, this.swapTohubSOL)
        dataToReload = 'dust-value'
        break
    }

    if (signatures?.length > 0) {
      this.storeEarningsRecord(signatures)
      this.dataToReload(dataToReload)
      this.closeModal()
      this.storeEarningPlatformRecord(signatures)

      this._loyaltyLeagueService.completeQuest(publicKey.toBase58(), 'stashInteract')

    }
    this.stashState.set(this.actionTitle)

  }
  dataToReload(data: string) {
    switch (data) {
      case 'value-deficient':
        this._stashService.updateZeroValueAssets(true)
        break
        // already gets updated after tx submitted in fetchPortfolio call under txi service
      case 'dust-value':
        this._helpersService.getDASAssets()
        this._stashService.updateDustValueTokens(false)
        break
      case 'defi-position':
        this._stashService.updateOutOfRangeDeFiPositions()
        break
    }
  }
  storeEarningsRecord(signatures: string[]) {
    const { publicKey } = this._helpersService.shs.getCurrentWallet();
    const extractedSOL = this.summary['SOL']
    const stashRecord = {
      txs: signatures,
      extractedSOL,
      walletOwner: publicKey.toBase58()
    }
    let stashReferralRecord = null
    if (this._earningsService.referralAddress()) {
      const platformFee = this.platformFeeInSOL()
        stashReferralRecord = {
          txs: signatures,
          referralFee: platformFee * 0.5,
          walletOwner: this._earningsService.referralAddress()
        }
    }
    this._earningsService.storeRecord(stashRecord, stashReferralRecord)
  }
  storeEarningPlatformRecord(signatures: string[]){
    const platformFee = this.platformFeeInSOL()
    const referralFee = this._earningsService.referralAddress() ? platformFee * 0.5 : 0
    const numberOfPositions = this.stashAssets.length
    const type = this.stashAssets[0].type
    this._earningsService.updatePlatformRecord(numberOfPositions, type, this.summary['SOL'], platformFee, referralFee, signatures)
  }
  closeModal() {
    this.modalCtrl.dismiss()
  }
}

