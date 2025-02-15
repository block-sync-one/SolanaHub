import {computed, inject, Injectable, signal} from '@angular/core';
import {combineLatest, from, map, mergeMap, Observable, take, tap} from "rxjs";
import {StorageKey, Utils} from "@app/enums";
import {StakeService} from "@app/pages/staking/stake.service";
import {BestRoute, ConvertToHubSolToken, JupRoute, LiquidStakeToken, Token} from "@app/models";
import {HelpersService} from "@app/pages/stash/helpers";
import {LiquidStakeService} from "@app/services/liquid-stake.service";
import {TokenType} from "@app/enums/token.enum";
import {JupStoreService, SolanaHelpersService, TxInterceptorService, VirtualStorageService} from "@app/services";


@Injectable({
  providedIn: 'root'
})
export class ConvertPositionsService {
  private readonly _vrs = inject(VirtualStorageService);
  private readonly _stakeService = inject(StakeService);
  private readonly _helpersService = inject(HelpersService);
  private readonly _jupStoreService = inject(JupStoreService);
  private readonly _lss = inject(LiquidStakeService);
  private readonly _txi = inject(TxInterceptorService);
  private readonly _shs = inject(SolanaHelpersService);

  private readonly data = signal<ConvertToHubSolToken[]>([])
  public readonly totalHubSolValue = computed(() => this.data().reduce((acc, cht) => acc + cht.hubSolValue, 0))
  public readonly lst = computed(() => this.data())
  private readonly hubSOLExchangeRate = signal(null);
  public readonly getHubSOLExchangeRate = this.hubSOLExchangeRate.asReadonly()
  private tokenOut: Token = {
    "address": "HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX",
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
      const {apy, exchangeRate} = sp.find(s => s.tokenMint === "HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX")
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
                map(({ value}) => ({
                  ...liquidStakeToken,
                  checked: true,
                  hubSolValue: value
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
    return totalSum > -1 ? filtered : [];
  }

  /**
   * Converts checked liquid stake tokens to hubSOL transactions
   *
   * @async
   * @param {Array<LiquidStakeToken & {checked: boolean}>} data - Array of liquid stake tokens
   * @returns {Promise<string[]>} Array of transaction IDs
   */
  async convertToHubSOL(data: ConvertToHubSolToken[]): Promise<string[]> {
    const tokens = data.filter((t) => t.checked)
      .map(this._helpersService.mapToSwapInfo);
    const ixs = await this._helpersService.getVersionedTransactions(tokens, true);
    return await this._helpersService._simulateBulkSendTx(ixs, 0);
  }

  calcBestRouteToHubSOL(amount: number, inputToken: Token, type: TokenType = TokenType.LIQUID, slippage: number = 50): Promise<BestRoute> {
    return this.calcBestRoute(amount, inputToken, this.tokenOut, type, slippage);
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
  async calcBestRoute(amount: number, inputToken: Token, outputToken: Token = this.tokenOut, type: TokenType = TokenType.LIQUID, slippage: number = 50): Promise<BestRoute> {
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
   * Executes a token swap transaction using the provided route
   *
   * @async
   * @param {JupRoute} route - The swap route containing the transaction details
   * @param {Token} outputToken - Token object containing decimal information for amount normalization
   * @returns {Promise<void>} Resolves when the swap transaction is complete
   * @throws {Error} If no valid swap route is found
   */
  public async submitSwap(route: JupRoute, outputToken: Token): Promise<void> {
    try {
      if (!route) {
        throw new Error('No valid swap route found');
      }
      // Calculate amounts using single-line operations
      const {decimals} = outputToken;
      const multiplier = Math.pow(10, decimals);
      route.outAmount = (Number(route.outAmount) * multiplier).toFixed(0);
      route.otherAmountThreshold = (Number(route.otherAmountThreshold) * multiplier).toFixed(0);
      const tx = await this._jupStoreService.swapTx(route);
      await this._txi.sendMultipleTxn([tx]);

    } catch (error) {
      console.error(error)
    }
  }
}

