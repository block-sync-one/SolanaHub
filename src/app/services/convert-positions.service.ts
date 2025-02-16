import {computed, inject, Injectable, signal} from '@angular/core';
import {combineLatest, from, map, mergeMap, Observable, take, tap} from "rxjs";
import {VersionedTransaction} from "@solana/web3.js";
import {StorageKey, TokenType, Utils} from "@app/enums";
import {BestRoute, ConvertToHubSolToken, JupRoute, LiquidStakeToken, SwapToken, Token} from "@app/models";
import {
  JupStoreService,
  LiquidStakeService,
  SolanaHelpersService,
  TxInterceptorService,
  VirtualStorageService
} from "@app/services";
import {ModelsAdapterService} from "@app/shared/services";
import {JupSwapTxData} from "@app/shared/models";
import {StakeService} from "@app/pages/staking/stake.service";

@Injectable({
  providedIn: 'root'
})
export class ConvertPositionsService {
  private readonly _vrs = inject(VirtualStorageService);
  private readonly _jupStoreService = inject(JupStoreService);
  private readonly _lss = inject(LiquidStakeService);
  private readonly _txi = inject(TxInterceptorService);
  private readonly _stakeService = inject(StakeService);
  private readonly _shs = inject(SolanaHelpersService);
  private readonly _modelsAdapterService = inject(ModelsAdapterService);

  private readonly data = signal<ConvertToHubSolToken[]>([])
  public readonly totalHubSolValue = computed(() => this.data().reduce((acc, cht) => acc + cht.hubSolValue, 0))
  public readonly lst = computed(() => this.data())
  private readonly hubSOLExchangeRate = signal(null);
  public readonly getHubSOLExchangeRate = this.hubSOLExchangeRate.asReadonly()
  private static readonly MIN_TOTAL_LST_VALUE = 1;
  private static readonly DEFAULT_SLIPPAGE = 50;
  private static readonly MIN_LST_VALUE = 0.1;
  private static readonly HUB_SOL_ADDRESS = 'HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX';
  private static readonly HUB_SOL: Token = {
    "address": `${ConvertPositionsService.HUB_SOL_ADDRESS}`,
    "chainId": 101,
    "decimals": 9,
    "name": "SolanaHub Staked SOL",
    "symbol": "hubSOL",
    "logoURI": "assets/images/hubSOL.svg",
  }

  constructor() {
    this.fetchHubSolExchangeRage();
  }

  fetchHubSolExchangeRage() {
    this._lss.getStakePoolList().then(sp => {
      const {apy, exchangeRate} = sp.find(s => s.tokenMint === `${ConvertPositionsService.HUB_SOL_ADDRESS}`)
      this.hubSOLExchangeRate.set(exchangeRate)
    })
  }

  isCountdownExpired(): boolean {
    return this._vrs.isCountdownExpired(StorageKey.STAKE_HUB_SOL);
  }

  hide() {
    this._vrs.hideWithOneMonthCooldown(StorageKey.STAKE_HUB_SOL);
  }

  /**
   * Observable that provides a list of stake tokens with their HubSOL conversion values.
   *
   * This observable:
   * 1. Takes the first emission of stake positions
   * 2. Filters out not matching requirements
   * 3. Calculates the best conversion route to HubSOL for each token
   * 4. Returns an array of tokens with their conversion values
   *
   * @returns {Observable<ConvertToHubSolToken[]>} An observable emitting an array of tokens
   *   with their conversion values and status flags
   */
  public getStakeLst$: Observable<ConvertToHubSolToken[]> =
    this._stakeService.stakePositions$
      .pipe(
        take(1),
        map(({liquid}) => this.getValidLstList(liquid)),
        mergeMap(p =>
          combineLatest([
            ...p.map(liquidStakeToken => {
              const {address, chainId, decimals, name, symbol, logoURI, balance} = liquidStakeToken;
              const inputToken = {address, chainId, decimals, name, symbol, logoURI, balance};

              return from(this.calcBestRouteToHubSOL(balance, inputToken)).pipe(
                map(({route, value}) => ({
                  ...liquidStakeToken,
                  checked: true,
                  hubSolValue: value,
                  route
                }))
              );
            })
          ])
        ),
        tap(result => this.data.set(result))
      );

  /**
   * Filters a list of LiquidStakeToken objects to exclude HUB_SOL tokens and returns
   * the filtered list only if the total balance exceeds 1.
   *
   * @param {LiquidStakeToken[]} tokens - Array of LiquidStakeToken objects to filter
   * @returns {LiquidStakeToken[]} Filtered array of tokens if total balance > 1, empty array otherwise
   */
  getValidLstList(tokens: LiquidStakeToken[]): LiquidStakeToken[] {
    const filtered = tokens.filter(item => item.symbol !== Utils.HUB_SOL);
    const totalSum = filtered.reduce((sum, item) => sum + item.balance, 0);
    return totalSum > ConvertPositionsService.MIN_TOTAL_LST_VALUE ? filtered.filter(item => item.balance > ConvertPositionsService.MIN_LST_VALUE) : [];
  }

  /**
   * Converts checked liquid stake tokens to hubSOL transactions
   *
   * @async
   * @param {Array<LiquidStakeToken & {checked: boolean}>} data - Array of liquid stake tokens
   * @returns {Promise<string[]>} Array of transaction IDs
   */
  async convertToHubSOL(data: ConvertToHubSolToken[]): Promise<string[]> {
    const txData: JupSwapTxData[] = data.filter((item) => item.checked)
      .map((item) => ({route: item.route, outputToken: this._modelsAdapterService.mapToSwapInfo(item)}));
    return await this.submitSwap(txData)
  }

  calcBestRouteToHubSOL(amount: number, inputToken: Token, type: TokenType = TokenType.LIQUID, slippage: number = ConvertPositionsService.DEFAULT_SLIPPAGE): Promise<BestRoute> {
    return this.calcBestRoute(amount, inputToken, ConvertPositionsService.HUB_SOL, type, slippage);
  }

  /**
   * Calculates the optimal trading route with normalized amounts
   *
   * @async
   * @param {number} amount - Initial amount to trade
   * @param {Token} inputToken - Source token for the trade
   * @param {Token} outputToken - Target token for the trade
   * @param {TokenType} [type=TokenType.LIQUID] - Trade type (LIQUID or NATIVE)
   * @param {number} [slippage=50] - Maximum acceptable price slippage
   * @returns {Promise<{route: JupRoute, value: number}>}
   *          Returns an object containing the computed route and calculated value
   */
  async calcBestRoute(amount: number, inputToken: Token, outputToken: Token = ConvertPositionsService.HUB_SOL, type: TokenType = TokenType.LIQUID, slippage: number = ConvertPositionsService.DEFAULT_SLIPPAGE): Promise<BestRoute> {
    const route = await this._jupStoreService.computeBestRoute(amount, inputToken, outputToken, slippage)
    const outAmount = (Number(route.outAmount) / 10 ** outputToken.decimals)
    const minOutAmount = (Number(route.otherAmountThreshold) / 10 ** outputToken.decimals)

    route.outAmount = outAmount.toString()
    route.otherAmountThreshold = minOutAmount.toString()

    return {
      route,
      value: type === TokenType.NATIVE ? (inputToken.balance / this.hubSOLExchangeRate()) : outAmount
    }
  }

  /**
   * Submits a deposit stake account for the current wallet
   *
   * @async
   * @param {string} address - The address to use for the stake account
   * @returns {Promise<void>} Resolves when the deposit stake account submission is complete
   */
  public async submitDepositAccount(address: string): Promise<void> {
    const {publicKey} = this._shs.getCurrentWallet()
    await this._lss.depositStakeAccount(publicKey, address)
  }

  /**
   * Submits one or more swap transactions
   *
   * @async
   * @param {JupSwapTxData | JupSwapTxData[]} jupSwapTxData
   *   Single or array of swap transaction data objects
   * @returns {Promise<string[]>} Promise resolving to an array of transaction signatures
   * @throws {Error} If no valid swap route is found
   */
  public async submitSwap(jupSwapTxData: JupSwapTxData | JupSwapTxData[]): Promise<string[]> {
    try {
      const data = Array.isArray(jupSwapTxData) ? jupSwapTxData : [jupSwapTxData];
      const txs: VersionedTransaction[] = [];

      for (const tx of data) {
        const {route, outputToken} = tx

        if (!route) {
          throw new Error('No valid swap route found');
        }

        const result = await this.getJupSwapTx(route, outputToken);
        txs.push(result);
      }

      const record = {message: 'Swap Positions', data: `Bulk convert to ${data[0].outputToken.symbol}`}
      return await this._txi.sendMultipleTxn(txs, null, record);

    } catch (error) {
      console.error(error)
    }

    return [];
  }

  /**
   * Creates a VersionedTransaction for the provided route
   *
   * @private
   * @async
   * @param {JupRoute} route - The swap route configuration
   * @param {SwapToken} outputToken - Token details including decimals
   * @returns {Promise<VersionedTransaction>} Promise resolving to the prepared transaction
   */
  private async getJupSwapTx(route: JupRoute, outputToken: SwapToken): Promise<VersionedTransaction> {
    const {decimals} = outputToken;
    const multiplier = Math.pow(10, decimals);
    route.outAmount = (Number(route.outAmount) * multiplier).toFixed(0);
    route.otherAmountThreshold = (Number(route.otherAmountThreshold) * multiplier).toFixed(0);

    return await this._jupStoreService.swapTx(route);
  }
}


