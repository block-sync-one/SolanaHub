import { computed, Injectable, signal } from '@angular/core';
import { SolanaHelpersService, VirtualStorageService } from 'src/app/services';
import va from '@vercel/analytics';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { environment } from 'src/environments/environment';
import { Premium } from "@app/models";
import { PremiumActions } from "@app/enums";

interface Account {
  isPremium: boolean;
  stake: number;
}

@Injectable({
  providedIn: 'root'
})
export class FreemiumService {
  public readonly isPremium = computed(() => this._account()?.isPremium ?? null);
  public readonly stake = computed(() => this._account()?.stake ?? 0);
  private _account = signal<Account | null>(null);
  private _premiumServices = signal<Premium[]>([]);
  static DEFAULT_PLATFORM_FEE = 3000000;
  private _platformFee = signal(FreemiumService.DEFAULT_PLATFORM_FEE); // Default to 0.003 SOL if platform fee is not set
  private _showAd = signal(this.getAdStatus());
  private _isPremiumCache = new Map<string, Account>();


  constructor(
    private _shs: SolanaHelpersService,
    private _vrs: VirtualStorageService,
  ) {
    this._initializeService();
    // effect(() => {
    setTimeout(() => {

      this._updateAccount();
    }, 4000);

    // });
  }

  /**
   * Checks if a premium action with the given name exists.
   *
   * @param {string} name - The name of the premium action to check.
   * @returns {boolean} True if the premium action exists, false otherwise.
   * @public
   */
  public isPremiumAction(name: string): boolean {
    return this._premiumServices().some((v) => v.name === name);
  }

  /**
   * Calculates the dynamic platform fee in SOL for a given action and total amount.
   *
   * @param {PremiumActions} action - The premium action to calculate the fee for.
   * @param {number} totalAmount - The total amount for which the fee is calculated if percentage
   * @returns {number} The calculated platform fee in SOL.
   */
  getDynamicPlatformFeeInSOL(action: PremiumActions, totalAmount: number): number {
    const actionFee = this.getFeeByAction(action);
    if (actionFee === undefined) {
      return FreemiumService.DEFAULT_PLATFORM_FEE / LAMPORTS_PER_SOL
    }

    if (actionFee?.percentage && totalAmount > 0) {
      return totalAmount * actionFee.fee;
    }

    return actionFee.fee;
  }

  public getFeeByAction(action: PremiumActions): Premium {
    return this._premiumServices().find((v) => v.name === action);
  }

  private async _initializeService(): Promise<void> {
    await this._fetchPremiumServices()
  }

  private async _fetchPremiumServices(): Promise<void> {
    try {
      const response = await fetch(`${environment.apiUrl}/api/freemium/get-premium-services`);
      const data = await response.json();
      this._premiumServices.set(data?.premiumServices);
    } catch (error) {
      console.error('Error fetching premium services:', error);
    }
  }

  // TODO: refactor
  public addServiceFee(walletPk: PublicKey, type: PremiumActions): TransactionInstruction | null {
    if (this.isPremium() || !type || !this.isPremiumAction(type)) {
      return null;
    }

    return SystemProgram.transfer({
      fromPubkey: walletPk,
      toPubkey: new PublicKey(environment.platformFeeCollector),
      lamports: this._platformFee(),
    });
  }

  private async _fetchAccount(walletAddress: string): Promise<Account | null> {
    if (this._isPremiumCache.has(walletAddress)) {
      return this._isPremiumCache.get(walletAddress)!;
    }

    try {
      const response = await fetch(`${environment.apiUrl}/api/freemium/get-is-premium?walletAddress=${walletAddress}`);
      const data: Account = await response.json();
      this._isPremiumCache.set(walletAddress, data);
      this._account.set(data);
      return data;
    } catch (error) {
      console.error('Error fetching account data:', error);
      return null;
    }
  }

  private async _updateAccount(): Promise<void> {
    const walletAddress = this._shs.getCurrentWallet()?.publicKey?.toString();
    console.log('walletAddress', walletAddress);
    if (!walletAddress) {
      this._account.set(null);
      return;
    }
    const account = await this._fetchAccount(walletAddress);
    this._account.set(account);
  }

  public hideAd(): void {
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);
    this._vrs.localStorage.saveData('hideFreemiumAd', expirationDate.toISOString());
    this._showAdEvent();
    this._showAd.set(false);
  }

  public getAdStatus(): boolean {
    const savedDate = this._vrs.localStorage.getData('hideFreemiumAd');
    if (savedDate) {
      const expirationDate = new Date(savedDate);
      if (expirationDate > new Date()) {
        return false;
      } else {
        this._vrs.localStorage.removeData('hideFreemiumAd');
      }
    }
    return true;
  }

  public readonly isAdEnabled = computed(() => {
    const isPremium = this.isPremium();
    if (isPremium === null) return null;
    return !isPremium && this._showAd();
  });

  private _showAdEvent(): void {
    va.track('hide freemium ad');
  }
}
