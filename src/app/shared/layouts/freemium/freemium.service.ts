import { computed, Injectable, signal } from '@angular/core';
import { SolanaHelpersService, VirtualStorageService } from 'src/app/services';
import va from '@vercel/analytics';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { environment } from 'src/environments/environment';
import { Premium } from "@app/models";
import { PremiumActions, StorageKey } from "@app/enums";

interface Account {
  isPremium: boolean;
  stake: number;
  premium_min_stake: number;
}

@Injectable({
  providedIn: 'root'
})
export class FreemiumService {
  public readonly isPremium = computed(() => this._account()?.isPremium ?? false);
  public readonly stake = computed(() => this._account()?.stake ?? 0);
  public readonly isAdEnabled = computed(() => this._account() && !this._account().isPremium && this._showAd());
  public readonly premiumMinStake = signal(null);
  private _account = signal<Account | null>(null);
  private _premiumServices = new Map<PremiumActions, Premium>();
  static DEFAULT_PLATFORM_FEE = 3000000; // Default to 0.003 SOL if platform fee is not set
  private _showAd = signal(!this._vrs.isCountdownExpired(StorageKey.PRO_AD));
  private _isPremiumCache = new Map<string, Account>();


  constructor(
    private _shs: SolanaHelpersService,
    private _vrs: VirtualStorageService,
  ) {
    this._initializeService();
  }

  /**
   * Checks if a premium action with the given name exists.
   *
   * @param {string} name - The name of the premium action to check.
   * @returns {boolean} True if the premium action exists, false otherwise.
   * @public
   */
  public isPremiumAction(name: string): boolean {
    return this._premiumServices.get(<PremiumActions> name).name === name;
  }

  /**
   * Calculates the dynamic platform fee in SOL for a given action.
   *
   * @param {PremiumActions} action - The premium action to calculate the fee for.
   * @param {number} [multiplier] - Optional multiplier for total fees calculation.
   * @returns {number} The calculated fee in SOL.
   * @throws {Error} If the action requires a total amount but none is provided.
   */
  calculatePlatformFeeInSOL(action: PremiumActions, multiplier?: number): number {
    const actionFee = this._premiumServices.get(action);
    let fee = 0;

    if(actionFee?.percentage && !multiplier){
      throw Error("Action is not valid. Please provide a total amount")
    }

    if (actionFee === undefined) {
      return FreemiumService.DEFAULT_PLATFORM_FEE / LAMPORTS_PER_SOL
    }

    if ((actionFee?.percentage || action === PremiumActions.STASH_OOR) && multiplier > 0) {
      fee = multiplier * actionFee.fee;
    } else {
      fee = actionFee.fee;
    }

    actionFee.valueInSol = fee;
    this._premiumServices.set(action, actionFee)

    return fee;
  }

  /**
   * Gets the dynamic platform fee in SOL for a given action.
   *
   * @param {PremiumActions} action - The premium action to calculate the fee for.
   * @returns {number} The fee in SOL for the given action.
   * @memberof _premiumServices
   */
  getDynamicPlatformFeeInSOL(action: PremiumActions): number {
    return this._premiumServices.get(action).valueInSol;
  }

  private async _initializeService(): Promise<void> {
    await this._fetchPremiumServices()
  }

  private async _fetchPremiumServices(): Promise<void> {
    try {
      const response = await fetch(`${environment.apiUrl}/api/freemium/get-premium-services`);
      const data = await response.json();
      data?.premiumServices.forEach((s) => this._premiumServices.set(s.name, s));
      this.premiumMinStake.set(data?.premium_min_stake);
    } catch (error) {
      console.error('Error fetching premium services:', error);
    }
  }

  public addServiceFee(walletPk: PublicKey, type: PremiumActions): TransactionInstruction | null {
    // if (this.isPremium() || !type || !this.isPremiumAction(type)) {
    //   return null;
    // }
console.log('add fees tx');

    if (!type || !this.isPremiumAction(type)) {
      return null;
    }

    return SystemProgram.transfer({
      fromPubkey: walletPk,
      toPubkey: new PublicKey(environment.platformFeeCollector),
      lamports: Math.floor(this._premiumServices.get(type).valueInSol * LAMPORTS_PER_SOL),
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

  public async updateAccountStatus(): Promise<void> {
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
    this._vrs.hideWithOneMonthCooldown(StorageKey.PRO_AD);
    this._showAdEvent();
    this._showAd.set(false);
  }

  private _showAdEvent(): void {
    va.track('hide freemium ad');
  }
}
