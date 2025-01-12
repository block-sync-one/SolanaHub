import {computed, effect, Injectable, signal} from '@angular/core';
import {SolanaHelpersService, VirtualStorageService} from 'src/app/services';
import va from '@vercel/analytics';
import {PublicKey, SystemProgram, TransactionInstruction} from '@solana/web3.js';
import {environment} from 'src/environments/environment';

interface Account {
  isPremium: boolean;
  stake: number;
}

@Injectable({
  providedIn: 'root'
})
export class FreemiumService {
  public readonly isPremium = computed(() => this._account()?.isPremium ?? null);
  public readonly stake = computed(() => this._account()?.stake ?? null);
  private _account = signal<Account | null>(null);
  private _premiumServices: string[] = [];
  private _platformFee: number | null = null;
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
   * Checks if the user's action is a premium action.
   *
   * @param {string} name - The name of the premium action to check.
   * @returns {boolean} True if the premium action exists, false otherwise.
   */
  public isPremiumAction(name: string): boolean {
    return this._premiumServices.includes(name);
  }

  private async _initializeService(): Promise<void> {
    await Promise.all([
      this._fetchPremiumServices(),
      this._fetchPlatformFee(),
    ]);
  }

  private async _fetchPremiumServices(): Promise<void> {
    try {
      const response = await fetch(`${environment.apiUrl}/api/freemium/get-premium-services`);
      const data = await response.json();
      this._premiumServices = data.premiumServices;
    } catch (error) {
      console.error('Error fetching premium services:', error);
    }
  }

  private async _fetchPlatformFee(): Promise<void> {
    try {
      const response = await fetch(`${environment.apiUrl}/api/freemium/get-platform-fee`);
      const data = await response.json();
      this._platformFee = data.platformFee;
    } catch (error) {
      console.error('Error fetching platform fee:', error);
    }
  }

  public addServiceFee(walletPk: PublicKey, type: string): TransactionInstruction | null {
    if (this.isPremium() || !this._premiumServices.includes(type)) {
      return null;
    }

    const fee = this._platformFee ?? 3000000; // Default to 0.003 SOL if platform fee is not set
    return SystemProgram.transfer({
      fromPubkey: walletPk,
      toPubkey: new PublicKey(environment.platformFeeCollector),
      lamports: fee,
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
