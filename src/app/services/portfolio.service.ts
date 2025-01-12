import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { UtilService } from './util.service';
import { mergePortfolioElementMultiples } from '@sonarwatch/portfolio-core';
import {
  BalanceChange,
  defiHolding,
  JupToken,
  NFT,
  Platform,
  Stake,
  Token,
  TransactionHistory,
  Validator,
  WalletEntry,
  WalletExtended,
  WalletPortfolio
} from '../models';

import va from '@vercel/analytics';

import { NativeStakeService, SolanaHelpersService, VirtualStorageService, WalletBoxSpinnerService } from './';
import { NavController } from '@ionic/angular';
import { historyResultShyft, TransactionHistoryShyft } from '../models/trsanction-history.model';
import { ToasterService } from './toaster.service';
import { PortfolioFetchService } from "./portfolio-refetch.service";
import { filter, from, switchMap } from 'rxjs';
import { WatchModeService } from './watch-mode.service';
import { RoutingPath } from '../shared/constants';
import { PortfolioDataKeys, WalletDataKeys } from "../enums";
import { HttpFetchService } from './http-fetch.service';

// Add new type definition
type FetchType = 'full' | 'partial';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  /**
   * A writable signal representing the portfolio map.
   * Contains a Map<string, WalletPortfolio> where keys are wallet addresses and values are WalletPortfolio objects.
   *
   * @type {WritableSignal<Map<string, WalletPortfolio>>}
   */
  private portfolioMap: WritableSignal<Map<string, WalletPortfolio>> = signal(new Map());

  public getPortfolioMapByAddress(walletAddress: string): WalletPortfolio {
    return (this.portfolioMap().get(walletAddress) || {} as WalletPortfolio)
  }

  /**
   * A computed property that returns an array of wallet objects from the portfolio map.
   * Each wallet object contains the wallet address and portfolio data.
   *
   * @remarks
   * This computed property will automatically rerender whenever the underlying `portfolioMap` signal changes.
   *
   * @returns {Array<WalletEntry>}
   */
  public portfolio: Signal<WalletEntry[]> = computed(() =>
    [...Array.from(this.portfolioMap().entries())
    .map(([walletAddress, portfolio]) => ({
    walletAddress,
    nickname: portfolio?.nickname,
    portfolio
  }))]);

  public mainWalletAddress = signal<string>(null);

  public walletAssets = signal(null);
  public tokens = signal<Token[]>(null);
  public nfts: WritableSignal<NFT[]> = signal(null);
  public staking: WritableSignal<Stake[]> = signal(null);
  public defi: WritableSignal<defiHolding[]> = signal(null);
  public walletHistory: WritableSignal<TransactionHistory[]> = signal(null);
  public netWorth = signal(0);

  readonly restAPI = this._utils.serverlessAPI
  constructor(
    private _httpFetchService: HttpFetchService,
    private _navCtrl: NavController,
    private _utils: UtilService,
    private _shs: SolanaHelpersService,
    private _vrs: VirtualStorageService,
    private _toastService: ToasterService,
    private _fetchPortfolioService: PortfolioFetchService,
    private _watchModeService: WatchModeService,
    private walletBoxSpinnerService: WalletBoxSpinnerService
  ) {
    this.observeMainAddressSync();
    this.getPlatformsData()
    this._shs.walletExtended$.subscribe(this.handleWalletChange.bind(this));
  }

  private updateCurrentWalletSignals(address: string) {
    const portfolio = this.portfolioMap().get(address);
    if (portfolio) {
      this.walletAssets.set(portfolio.walletAssets);
      this.tokens.set(portfolio.tokens);
      this.nfts.set(portfolio.nfts);
      this.staking.set(portfolio.staking);
      this.defi.set(portfolio.defi);
      this.walletHistory.set(portfolio.walletHistory);
      this.netWorth.set(portfolio.netWorth);
    }
  }

  /**
   * Saves current wallet data to the portfolio map.
   *
   * @param {string} address - The solana address of the wallet.
   * @returns {void}
   *
   * @description
   * This method updates the portfolio map with the latest wallet data for a given address.
   * It creates a new Map based on the current portfolio map, sets the wallet data as a new entry,
   * and updates the portfolio map with this new entry.
   *
   * @example
   * // Example usage:
   * wallet.saveToPortfolioMap("0x1234567890123456789012345678901234567890", false);
   */
  private saveToPortfolioMap(address: string, nickname?: string): void {
    const newMap = new Map(this.portfolioMap());
    newMap.set(address, {
      walletAssets: this.walletAssets(),
      tokens: this.tokens(),
      nfts: this.nfts(),
      staking: this.staking(),
      defi: this.defi(),
      walletHistory: this.walletHistory(),
      netWorth: this.netWorth(),
      enabled: true,
      nickname: nickname || null
    });
    this.portfolioMap.set(newMap);
    this.walletBoxSpinnerService.hide();
  }

  /**
   * Removes the specified address from the portfolio map.
   *
   * @remarks
   * The portfolio signal will get re-rendered after this operation.
   *
   * @param {string} address - The address of the wallet to remove from the portfolio.
   * @returns {void}
   */
  public removeFromPortfolioMap(address: string): void {
    const newMap = new Map(this.portfolioMap());
    newMap.delete(address)
    this.removedLinkedWallet(address);
    this.portfolioMap.set(newMap)
  }

  /**
   * Updates portfolio data for the specified address by key-value pair.
   *
   * @remarks
   * The portfolio signal will get re-rendered after this operation.
   *
   * @param {string} walletAddress - The address of the wallet to update.
   * @param {string} key - The key of the data to update.
   * @param {any} value - The new value for the specified key.
   * @returns {void}
   */
  private updateWalletDataByKey(walletAddress: string, key: string, value: any): void {
    const walletPortfolio = this.portfolioMap().get(walletAddress)!;
    const newMap = new Map(this.portfolioMap());
    this.portfolioMap.set(newMap.set(walletAddress, {
      ...walletPortfolio,
      [key]: value
    }));
  }

  /**
   * Toggles the wallet status for the specified address.
   *
   * @param {string} walletAddress - The address of the wallet to toggle.
   * @returns {void}
   */
  public toggleWallet(walletAddress: string): void {
    const walletPortfolio = this.portfolioMap().get(walletAddress)!;
    this.updateWalletDataByKey(walletAddress, PortfolioDataKeys.ENABLED, !walletPortfolio.enabled);
  }

  private async handleWalletChange(wallet: WalletExtended) {
    if (!wallet) return;
    const address = this.extractAddressOnWalletChanges(wallet);

    if(address != this.mainWalletAddress()) { // the wallet connect callback is executed twice
      this.mainWalletAddress.set(address);
      await this.syncPortfolios(address)
      this.updateCurrentWalletSignals(this.mainWalletAddress())
      this.loadLinkedWallets()
    }
  }

  /**
   * Extracts and returns the public key address from a WalletExtended object.
   *
   * @param {WalletExtended} wallet - The WalletExtended object containing the public key.
   * @returns {string} The extracted public key address as a base58 string.
   */
  private extractAddressOnWalletChanges(wallet: WalletExtended): string {
    return wallet.publicKey.toBase58();
  }

  /**
   * Synchronizes portfolios for a given wallet address.
   *
   * This method checks if data already exists for the provided address,
   * and either fetches new data or updates existing signals accordingly.
   *
   * @param {string} address - The wallet address to synchronize.
   */
  public async syncPortfolios(address: string, resync: boolean = false, nickname?: string) {
    if (!this.containsWallet(address) || resync) {
      console.log('syncPortfolios:', address, "resync:", resync);

      this.walletBoxSpinnerService.show();
      await this.getPortfolioAssets(address, true, false, 'full', nickname);

      if (nickname) {
        this.updateWalletDataByKey(address, 'nickname', nickname);
      }
    }

    // this._portfolioLinkedWallet(this.portfolioMap())
  }

  /**
   * Sync main address portfolio when requested
   * @remarks When `shouldRefresh` is {@link true}, this method triggers an async call.
   *
   * @private
   * @returns {void}
   */
  private observeMainAddressSync(): void {
    this._fetchPortfolioService.syncMainAddressPortfolio()
      .pipe(
        filter( ({shouldRefresh}) => shouldRefresh),
        switchMap(({ fetchType}) => {
            const walletOwner = this._shs.getCurrentWallet().publicKey.toBase58();
            return from(this.getPortfolioAssets(walletOwner,  true, false, fetchType));
        })
      ).subscribe();
  }

  /**
   * Checks if a wallet address exists in the portfolio map.
   *
   * @param {string} address - The wallet address to check.
   * @returns {boolean} True if the address exists in the portfolio map, false otherwise.
   */
  public containsWallet(address: string): boolean {
    return this.portfolioMap().has(address)
  }

  public async getPortfolioAssets(
    walletAddress: string,
    forceFetch = false,
    watchMode: boolean = false,
    fetchType: FetchType = 'full',
    nickname?: string
  ) {
    let portfolioData = await this.fetchPortfolioData(walletAddress, fetchType);

    try {

      await this.processPortfolioData({...portfolioData}, walletAddress, fetchType, nickname);

      va.track('fetch portfolio', {
        status: 'success',
        wallet: walletAddress,
        watchMode,
        fetchType
      });
    } catch (error) {
      this.handlePortfolioError(error, walletAddress);
    }
  }

  private async fetchPortfolioData(walletAddress: string, fetchType: FetchType = 'full') {
    const response: any  = await this._httpFetchService.get(`/api/portfolio/holdings?address=${walletAddress}&fetchType=${fetchType}`);
    console.log(response);
    // data.elements = data.elements.filter(e => e?.platformId !== WalletDataKeys.NFTs);
    return response;
  }


  private async processPortfolioData(portfolioData: any, walletAddress: string, fetchType: FetchType = 'full', nickname?: string) {
    const tempNft = portfolioData.elements.find(group => group.platformId === WalletDataKeys.NFT_V2);
    const excludeNFTv2 = portfolioData.elements.filter(e => e.platformId !== WalletDataKeys.NFT_V2);
    const staking = portfolioData.elements.find(e => e.platformId === WalletDataKeys.NATIVE_STAKE);
    const mergeDuplications = mergePortfolioElementMultiples(excludeNFTv2);
    const tokenJupData = Object.values(portfolioData.tokenInfo.solana);
    const extendTokenData = mergeDuplications.find(group => group.platformId === WalletDataKeys.TOKENS);

      await this._portfolioStaking(walletAddress,staking );
      await this._portfolioTokens(extendTokenData as any, tokenJupData as any);

       if (fetchType !== 'partial') {
         await this._portfolioDeFi(excludeNFTv2, tokenJupData);
         // mergeDuplications.push(tempNft);
         this.walletAssets.set(mergeDuplications);
         this.netWorth.set(portfolioData.value);
       }

       // Save processed data to map
       this.saveToPortfolioMap(walletAddress, nickname);


    // Load NFT afterward, since call is expensive
    this._portfolioNFT(walletAddress)
  }

  private handlePortfolioError(error: any, walletAddress: string) {
    console.error(error);
    this.walletAssets.set([]);
    va.track('fetch portfolio', { status: 'failed', wallet: walletAddress });
    this._toastService.msg.next({
      segmentClass: 'toastError',
      message: 'Failed to import wallet info, please contact support',
      duration: 5000
    });
  }

  private async _portfolioTokens(tokens: any, jupTokens: JupToken[]): Promise<void> {


    if (tokens) {
      // const LST_direct_stake = await this._lss.getDirectStake(walletAddress)

      let tokensData = this._utils.addTokenData(tokens?.data.assets, jupTokens)


      // add pipes
      // const tokensAggregated: Token[] = tokensData.filter(item => item.value)
      this.tokens.set(tokensData)
    }
  }

  public async _portfolioNFT(walletAddress: string) {
    try {
      const getNfts = await fetch(`${this.restAPI}/api/portfolio/nft?address=${walletAddress}`)
      const nfts = await getNfts.json()
      // loop through nfts and add logoURI from image_uri
      const nftExtended = nfts.data.assets?.map(nft => {
        return {
          ...nft,
          logoURI: nft.image_uri,
          address: nft.mint,
          value: nft.value
        }
      })
      this.nfts.set(nftExtended);
      const nftsValue = nfts.value
      this.updateWalletDataByKey(walletAddress, PortfolioDataKeys.NFTS, this.nfts());
      this.updateWalletDataByKey(walletAddress, PortfolioDataKeys.NETWORTH, this.netWorth() + nftsValue);
      this.updateWalletDataByKey(walletAddress, PortfolioDataKeys.WALLET_ASSETS, [...this.portfolioMap().get(walletAddress).walletAssets, nfts]);
      this.updateCurrentWalletSignals(this.mainWalletAddress())
    } catch (error) {
      console.error(error);
    }
  }

  private _platforms = []

  public async getPlatformsData(): Promise<Platform[]> {
    if (this._platforms.length) {
      return this._platforms
    }

    try {
      this._platforms = await (await fetch(`${this.restAPI}/api/portfolio/platforms`)).json();
    } catch (error) {
      console.warn(error)
    }
    return this._platforms
  }

  private async _portfolioDeFi(editedDataExtended, tokensInfo) {
    // add more data for platforms
    const getPlatformsData = await this.getPlatformsData();
    const excludeList = [WalletDataKeys.TOKENS, WalletDataKeys.NFTs, WalletDataKeys.NATIVE_STAKE]
    const defiHolding = await Promise.all(editedDataExtended
      .filter(g => !excludeList.includes(g.platformId))
      .sort((a: defiHolding, b: defiHolding) => a.value > b.value ? -1 : 1)
      .map(async group => {


        let records: defiHolding[] = [];
        // add if id =juptier jupiter-governance
        group.platformId = group.platformId === WalletDataKeys.JUPITER_GOVERNANCE ? WalletDataKeys.JUPITER_EXCHANGE : group.platformId
        const platformData = getPlatformsData.find(platform => platform.id === group.platformId);
        Object.assign(group, platformData);

        if (group.type === WalletDataKeys.LIQUIDITY) {
          if (group.data.liquidities) {
            group.data.liquidities.map(async position => {

              const extendTokenData = this._utils.addTokenData(position.assets, tokensInfo)

              // if symbol is wSOL, then replace it to SOL
              extendTokenData.map(asset => {
                asset.symbol = asset.symbol === 'wSOL' ? 'SOL' : asset.symbol
              })


              records.push({
                value: extendTokenData.reduce((acc, asset) => acc + asset.value, 0),
                logoURI: group.image,
                holdings: extendTokenData.map(a => { return { balance: a.balance, symbol: a.symbol, decimals: a.decimals, condition: a.condition } }) || [],
                poolTokens: extendTokenData?.map(a => { return { address: a.address, logoURI: a.logoURI, symbol: a.symbol, decimals: a.decimals } }) || [],
                type: group.label,
                link: group.website,
                platform: group.platformId,
                tags: group.tags
              })


              // return record
            })

          }
        }
        if (group.type === "multiple") {
          group.data.assets.map(async asset => {

            const extendTokenData = this._utils.addTokenData([asset], tokensInfo)

            // if symbol is wSOL, then replace it to SOL
            extendTokenData.map(asset => {
              asset.symbol = asset.symbol === 'wSOL' ? 'SOL' : asset.symbol
            })

            records.push({
              value: extendTokenData.reduce((acc, asset) => acc + asset.value, 0),
              logoURI: group.image,
              holdings: extendTokenData.map(a => { return { balance: a.balance, symbol: a.symbol, decimals: a.decimals, condition: a.condition } }) || [],
              poolTokens: extendTokenData?.map(a => { return { address: a.address, logoURI: asset.imageUri ? asset.imageUri : a.logoURI, symbol: asset.name ? asset.name : a.symbol, decimals: a.decimals } }) || [],
              type: group.label,
              link: group.website,
              platform: group.platformId,
              tags: group.tags
            })
          })
          // assets = assets.flat()
        }

        if (group.type === WalletDataKeys.BORROW_LEND) {

          group.data.suppliedAssets.map(async asset => {
            const extendTokenData = this._utils.addTokenData([asset], tokensInfo)

            // if symbol is wSOL, then replace it to SOL
            extendTokenData.map(asset => {
              asset.symbol = asset.symbol === 'wSOL' ? 'SOL' : asset.symbol
            })

            records.push({
              value: extendTokenData.reduce((acc, asset) => acc + asset.value, 0),
              logoURI: group.image,
              holdings: extendTokenData.map(a => { return { balance: a.balance, symbol: a.symbol, decimals: a.decimals, condition: 'credit' } }) || [],
              poolTokens: extendTokenData.map(a => { return { address: a.address, logoURI: a.logoURI, symbol: a.symbol, decimals: a.decimals } }) || [],
              type: group.label,
              link: group.website,
              platform: group.platformId,
              tags: group.tags
            })
          })
          group.data.borrowedAssets.map(async asset => {

            const extendTokenData = this._utils.addTokenData([asset], tokensInfo)

            // if symbol is wSOL, then replace it to SOL
            extendTokenData.map(asset => {
              asset.symbol = asset.symbol === 'wSOL' ? 'SOL' : asset.symbol
            })

            records.push({
              value: extendTokenData.reduce((acc, asset) => acc + asset.value, 0),
              logoURI: group.image,
              holdings: extendTokenData.map(a => { return { balance: a.balance, symbol: a.symbol, decimals: a.decimals, condition: 'debt' } }) || [],
              poolTokens: extendTokenData.map(a => { return { address: a.address, logoURI: a.logoURI, symbol: a.symbol, decimals: a.decimals } }) || [],
              type: group.label,
              link: group.website,
              platform: group.platformId,
              tags: group.tags
            })
          })
        }
        return records
      })
    )

    this.defi.set(defiHolding.flat())

  }
  public async getWalletHistory(walletAddress: string): Promise<WritableSignal<TransactionHistory[]>> {

    try {
      const getTxHistory = await fetch(`${this.restAPI}/api/portfolio/transaction-history?address=${walletAddress}`)
      const txHistory: TransactionHistoryShyft = await getTxHistory.json()

      // console.log(txHistory);
      const excludeConditions = (txRecord: historyResultShyft) => txRecord.status != "Fail" && txRecord.type != 'COMPRESSED_NFT_MINT' && txRecord.type != "UNKNOWN" && !(txRecord.type == "SOL_TRANSFER" && txRecord.actions[0].info.amount === 0)
      const aggregateTxHistory: TransactionHistory[] = txHistory.result.filter(txRecord => excludeConditions(txRecord)).map((txRecord: historyResultShyft) => {
        console.log(txRecord);

        let actionData = txRecord.actions[0]
        let tx: TransactionHistory = {
          txHash: txRecord.signatures[0],
          from: this._utils.addrUtil(txRecord.fee_payer).addrShort,
          to: this._utils.addrUtil(txRecord.signatures[0]).addrShort,
          timestamp: txRecord.timestamp,
          fee: txRecord.fee,
          mainAction: txRecord.type.replaceAll('_', ' ').toLowerCase(),
          case: 'native',
          balanceChange: null
        };
        switch (actionData.type) {
          case "SWAP":
            tx.case = 'defi'
            const tokenIn = actionData.info.tokens_swapped.in
            const tokenOut = actionData.info.tokens_swapped.out
            let swapBalance: BalanceChange[] = [
              {
                type: 'in',
                amount: tokenIn.amount,
                symbol: tokenIn.symbol,
                name: tokenIn.name,
                decimals: null,
                address: tokenIn.token_address,
                logoURI: tokenIn.image_uri,
              },
              {
                type: 'out',
                amount: tokenOut.amount,
                symbol: tokenOut.symbol,
                name: tokenOut.name,
                decimals: 9,
                address: tokenOut.token_address,
                logoURI: tokenOut.image_uri,
              }
            ]
            tx.balanceChange = swapBalance
            break;
          case "SOL_TRANSFER":
            let sendBalance: BalanceChange[] = [
              {
                type: 'in',
                amount: tokenIn.amount,
                symbol: tokenIn.symbol,
                name: tokenIn.name,
                decimals: null,
                address: tokenIn.token_address,
                logoURI: tokenIn.image_uri,
              }
            ]
            tx.balanceChange = sendBalance

            // let BalanceChange: BalanceChange[] = [
            //   {
            //     amount: tokenIn.amount,
            //     symbol: tokenIn.symbol,
            //     name: tokenIn.name,
            //     decimals: null,
            //     address: tokenIn.token_address,
            //     logoURI: tokenIn.image_uri,
            //   },
            //   {
            //     amount: tokenOut.amount,
            //     symbol: tokenOut.symbol,
            //     name: tokenOut.name,
            //     decimals: 9,
            //     address: tokenOut.token_address,
            //     logoURI: tokenOut.image_uri,
            //   }
            // ]
            // tx.balanceChange = BalanceChange
            break;
          case "SOL_TRANSFER":

            break;
          default:
            // tx.balanceChange = BalanceChange
            break;

        }

        // if (tx.contractLabel?.name === 'Jupiter V6') {
        //   tx.mainAction = 'swap'
        // }
        // if (tx.mainAction === 'createAssociatedAccount') {
        //   tx.mainAction = 'create account'
        // }
        // if (tx.to === 'FarmuwXPWXvefWUeqFAa5w6rifLkq5X6E8bimYvrhCB1') {
        //   tx.mainAction = 'farm'
        // }
        // tx.fromShort = this._utils.addrUtil(tx.from).addrShort
        // tx.toShort = this._utils.addrUtil(tx.to).addrShort
        // tx.balanceChange.forEach(b => b.amount = b.amount / 10 ** b.decimals)

        return tx

      })

      this.walletHistory.set(aggregateTxHistory)
      return this.walletHistory
    } catch (error) {
      console.error(error);
    }
    return this.walletHistory

  }

  public async _portfolioStaking(walletAddress: string, staking?: any) {
    // const stakeAccounts = (await this._nss.getOwnerNativeStake(walletAddress)).sort((a, b) => a.balance > b.balance ? -1 : 1);

    const validators: Validator[] = await this._shs.getValidatorsList()
    const stateEnum = {
      activating: "Activating",
      unstaking: "Deactivating",
      active : "Active",
      inactive : "Inactive"
    }
    const stakeAccountsSonar = staking?.data?.assets?.map(acc =>{
      let validator = validators.find(v => v.name === acc.name)
      const sonarState = acc.attributes.tags[0].toLowerCase()
      return {
        validatorName: acc.name,
        validatorImg: acc.imageUri,
        balance:acc.data.amount,
        apy: validator?.total_apy,
        state: stateEnum[sonarState]
      }
    }).sort((a, b) => a.balance > b.balance ? -1 : 1);

    this.staking.set(stakeAccountsSonar)

    // const getStakeAccountsWithInfaltionRewards = await this._nss.getStakeRewardsInflation(stakeAccounts)
    // this.staking.set(getStakeAccountsWithInfaltionRewards)
    // this.updateWalletDataByKey(walletAddress, PortfolioDataKeys.STAKING, this.staking());
    // console.log('getStakeAccountsWithInfaltionRewards', this.staking());
  }

  public filteredTxHistory = (filterByAddress?: string, filterByAction?: string) => {
    const filterResults = null//this.walletHistory().filter((tx:TransactionHistory) => tx.balanceChange.find(b => b.address === filterByAddress) || tx.mainAction === filterByAction)

    return filterResults
  }

  public async clearWallet() {
    if (this.mainWalletAddress()) {
      const newMap = new Map(this.portfolioMap());
      newMap.delete(this.mainWalletAddress());
      this.portfolioMap.set(newMap);
    }

    // clear state of wallet connect
    this._watchModeService.watchedWallet$.next(null)

    // clean session storage
    this._vrs.sessionStorage.clearData()

    this.clearCurrentPortfolioData();
    this._fetchPortfolioService.triggerFetch()
    this._navCtrl.navigateBack([RoutingPath.NOT_CONNECTED]);
  }

  private clearCurrentPortfolioData() {
    this.walletAssets.set(null)
    this.tokens.set(null)
    this.nfts.set(null)
    this.defi.set(null)
    this.staking.set(null)
    this.walletHistory.set(null)
    this.netWorth.set(null)
  }

  public updateWalletNickname(address: string, nickname: string): void {
    this.updateWalletDataByKey(address, 'nickname', nickname);
  }

  // the purpose of this is to link saved wallet with the conn
  public readonly MAX_LINKED_WALLETS = 4;

  public async loadLinkedWallets() {
    // Get existing linked wallets from localStorage
    const linkedWallets = JSON.parse(this._vrs.localStorage.getData('linkedWallets') || '[]');

    // Sync portfolios for all linked wallets sequentially
    for (const wallet of linkedWallets) {
      const { address, nickname } = wallet;
      if(!this.containsWallet(address)) {
        await this.syncPortfolios(address, false, nickname);
      } else {
        // Remove connected address if it was part of the likedWallets
        this.removedLinkedWallet(address)
      }
    }
  }

  public updateLinkedWallets(newWallet?: { address: string; nickname: string }): void {
    // Get connected wallet address
    const connectedWalletAddress = this._shs.getCurrentWallet().publicKey.toBase58();

    // Get existing linked wallets from localStorage
    const existingWallets = JSON.parse(this._vrs.localStorage.getData('linkedWallets') || '[]');

    // Create new array with existing wallets
    let linkedWallets = [...existingWallets];

    // Add new wallet if provided
    if (newWallet) {
      linkedWallets.push(newWallet);
    }

    // Remove duplicates and connected wallet
    linkedWallets = linkedWallets
      .filter((wallet, index, self) =>
        // Remove duplicates
        index === self.findIndex(w => w.address === wallet.address) &&
        // Remove connected wallet
        wallet.address !== connectedWalletAddress
      )
      // Limit to MAX_LINKED_WALLETS
      .slice(0, this.MAX_LINKED_WALLETS);

    // Save to localStorage
    this._vrs.localStorage.saveData('linkedWallets', JSON.stringify(linkedWallets));
  }


  removedLinkedWallet(address: string): void {
    const linkedWallets = JSON.parse(this._vrs.localStorage.getData('linkedWallets') || '[]');
    const index = linkedWallets.findIndex(item => item.address === address);
    if (index !== -1) {
      linkedWallets.splice(index, 1);
      this._vrs.localStorage.saveData('linkedWallets', JSON.stringify(linkedWallets));
    }
  }
}
