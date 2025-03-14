import { computed, effect, inject, Injectable, Signal, signal } from "@angular/core";
import { JupStoreService } from "./jup-store.service";
import { PortfolioService } from "./portfolio.service";
import { NFT, NftTable, WalletEntry } from "../models";
import { UtilService } from "./util.service";

@Injectable({
  providedIn: 'root'
})
export class PortfolioBreakdownService {
  public readonly _jupStore = inject(JupStoreService)
  public readonly _portfolioService = inject(PortfolioService)
  public readonly _utils = inject(UtilService)
  private readonly excludedAssets = signal<Set<string>>(new Set());
  public readonly solPrice = this._jupStore.solPrice;

  constructor() {
    effect(() => {
      console.log("Enabled Portfolio", this.getEnabledPortfolio())
    });
  }

  /**
   * Computes and returns an array of enabled DeFi assets after merging entries.
   *
   * @public
   * @returns {Signal<any[]>} A signal containing merged DeFi entries across enabled portfolios
   *
   * @description
   * Retrieves DeFi entries from enabled portfolios, adds wallet addresses, and merges similar entries
   *
   * @example
   * // Returns a signal with merged DeFi entries like:
   * // [{ walletAddress: '0x123...', type: 'token', holdings: [...], value: 300 }]
   */
  public getEnabledDefiAssets: Signal<any[]> = computed(() => {
    const defi = this.getEnabledPortfolio().map(({walletAddress, portfolio}) => {
        if (portfolio.defi) {
          return portfolio.defi?.map(value => ({
            walletAddress,
            ...value
          }))
        }
        return [];
      }
    ).flat()

    return this.mergeDefiEntries(defi)
  });

  /**
   * Computes and returns an array of enabled staking assets across portfolios.
   *
   * @public
   * @returns {Signal<any[]>} A signal containing staking entries from enabled portfolios
   *
   * @description
   * Extracts staking assets from each enabled portfolio and flattens them into a single array
   *
   */
  public getEnabledStakeAssets: Signal<any[]> = computed(() => {
    return this.getEnabledPortfolio()
      .map(({portfolio}) => {
        if (portfolio.staking) return portfolio.staking
        return []
      }).flat()
  });


  /**
   * Merges and consolidates DeFi entries by grouping them based on type, platform, holdings, and pool tokens.
   *
   * @private
   * @param {Array} entries - An array of DeFi entry objects to be merged
   * @returns {Array} A consolidated array of merged DeFi entries
   *
   * @description
   * This method performs the following operations:
   * - Groups entries with identical type, platform, holdings, and pool tokens
   * - Aggregates total value across matching entries
   * - Merges holdings with the same symbol and decimals
   * - Collects wallet addresses and their respective balances in a breakdown
   * - Preserves unique pool tokens
   *
   * @example
   * const entries = [
   *   {
   *     type: 'Deposit',
   *     platform: 'realms',
   *     holdings: [{ symbol: 'MNGO', decimals: 6, balance: 1 }],
   *     poolTokens: [{ address: 'MangoCz...', symbol: 'Mango', decimal: 6 }],
   *     walletAddress: '0x123...',
   *     value: 100
   *   },
   *   {
   *     type: 'Deposit',
   *     platform: 'realms',
   *     holdings: [{ symbol: 'MNGO', decimals: 6, balance: 2 }],
   *     poolTokens: [{ address: 'MangoCz...', symbol: 'Mango', decimal: 6 }],
   *     walletAddress: '0x456...',
   *     value: 200
   *   },
   *   {
   *     type: 'Deposit',
   *     platform: 'realms',
   *     holdings: [{ symbol: 'MNGO', decimals: 6, balance: 5 }],
   *     poolTokens: [{ address: 'TestAdress...', symbol: 'Mango', decimal: 6 }],
   *     walletAddress: '0x789...',
   *     value: 50
   *   }
   * ];
   *
   * // Returns:
   * [
   *   {
   *     type: 'Deposit',
   *     platform: 'realms',
   *     holdings: [{ symbol: 'MNGO', decimals: 6, balance: 3 }],
   *     poolTokens: [{ address: 'MangoCz...', symbol: 'Mango', decimal: 6 }],
   *     value: 300,
   *     breakdown: [
   *       { walletAddress: '0x123...', balance: 1, value: 100 },
   *       { walletAddress: '0x456...', balance: 2, value: 200 }
   *     ]
   *   },
   *   {
   *     type: 'token',
   *     platform: 'ethereum',
   *     holdings: [{ symbol: 'MNGO', decimals: 6, balance: 5 }],
   *     poolTokens: [{ address: 'TestAdress...', symbol: 'Mango', decimal: 6 }],,
   *     value: 50,
   *     breakdown: [
   *       { walletAddress: '0x789...', balance: 5, value: 50 }
   *     ]
   *   }
   * ]
   *
   */
  private mergeDefiEntries(entries) {
    // Group entries by type and platform
    const groupedEntries = entries.reduce((acc, entry) => {
      // Create a canonical representation of holdings for comparison
      const normalizedHoldings = entry.holdings
        .map(h => JSON.stringify({
          symbol: h.symbol,
          decimals: h.decimals
        }))

      // Create a canonical representation of pool tokens for comparison
      const normalizedPoolTokens = entry.poolTokens
        .map(pt => JSON.stringify({
          address: pt.address,
          symbol: pt.symbol,
          decimals: pt.decimals
        }))

      // Create a key that includes type, platform, and normalized holdings and pool tokens
      const key = JSON.stringify({
        type: entry.type,
        platform: entry.platform,
        holdings: normalizedHoldings,
        poolTokens: normalizedPoolTokens
      });

      if (!acc[key]) {
        acc[key] = {
          ...entry,
          value: 0,
          holdings: [],
          poolTokens: [],
          breakdown: []
        };
      }

      // Merge values
      acc[key].value += entry.value;

      // Merge holdings (assuming same symbol)
      entry.holdings.forEach(holding => {
        const existingHolding = acc[key].holdings.find(h =>
          h.symbol === holding.symbol &&
          h.decimals === holding.decimals
        );

        if (existingHolding) {
          existingHolding.balance += holding.balance;
        } else {
          acc[key].holdings.push({...holding});
        }
      });

      // Add to breakdown
      acc[key].breakdown.push({
        walletAddressShort: this._utils.addrUtil(entry.walletAddress).addrShort,
        walletAddress: entry.walletAddress,
        balance: entry?.holdings?.[0]?.balance,
        value: entry.value
      });

      // Merge pool tokens (assuming same address)
      entry.poolTokens.forEach(poolToken => {
        const existingPoolToken = acc[key].poolTokens.find(pt =>
          pt.address === poolToken.address
        );

        if (!existingPoolToken) {
          acc[key].poolTokens.push({...poolToken});
        }
      });

      return acc;
    }, {});

    // Convert back to array and remove key
    return Object.values(groupedEntries)
  }

  /**
   * Gets an array of assets from enabled wallets.
   *
   * @type {Signal<any[]>}
   * @readonly
   * @description
   * This computed property returns a Signal that contains an array of assets
   * from wallets that have their portfolio enabled.
   *
   * @returns {Signal<any[]>} A Signal representing an array of assets from enabled wallets.
   */
  public getEnabledWalletsAssets: Signal<any[]> = computed(() => {
    return this.getEnabledPortfolio()
      .map(({ portfolio }) => portfolio.walletAssets)
      .flat()
  });

  /**
   * Groups / Merge token data by address.
   *
   * @returns an array of grouped token data objects.
   *
   * @remarks
   * This method processes an array of wallet data and groups tokens by address.
   * It aggregates balances and values across all wallets for each unique token address.
   * The resulting data structure includes aggregated values, balances, and a breakdown of contributing wallets.
   */
  public getTokensBreakdown: Signal<any[]> = computed(() => {
    const assets = this.getEnabledPortfolio();
    if (!assets) return [];
    const tokenMap = new Map();
    assets.forEach(wallet => {
      const { walletAddress, portfolio } = wallet
      const { tokens } = portfolio
      if (!tokens) return;
      tokens.forEach(token => {
        const { address, value, balance } = token;
        let newBalance = balance;
        let newValue = value;

        if (!tokenMap.has(address)) {
          tokenMap.set(address, {
            ...token,
            breakdown: []
          });
          newBalance = 0;
          newValue = 0;
        }

        const existingToken = tokenMap.get(address);
        existingToken.value += newValue;
        existingToken.balance += newBalance;
        existingToken.breakdown.push({
          walletAddressShort: this._utils.addrUtil(walletAddress).addrShort,
          walletAddress,
          value,
          balance
        });
      });
    });

    return Array.from(tokenMap.values());
  })


  /**
   * Computed property that returns a breakdown of NFT collections across enabled portfolios.
   *
   * @returns {any[]} Array of NFT collections with their total value, count, and per-wallet value distribution.
   *
   * Each object in the returned array represents an NFT collection and has the following structure:
   * @example
   * [
   *   {
   *     collectionName: "Mad Labs",
   *     count: 3,
   *     value: 100.5,
   *     nfts: [...],
   *     breakdown: Map("wallet1" => 60.5, "wallet2" => 40.0)
   *   }
   * ]
   */
  public getNFTsBreakdown: Signal<any[]> = computed(() => {
    const assets = this.getEnabledPortfolio();
    if (!assets) return [];
    const nftCollectionMap = new Map();

    assets.forEach(wallet => {
      const { walletAddress, portfolio } = wallet

      const nftsData = this.nftDataAggregator(portfolio.nfts);

      nftsData.forEach(data => {
        const { collectionName, value } = data;
        const { nfts, ...rest } = data;

        if (!nftCollectionMap.has(collectionName)) {
          nftCollectionMap.set(collectionName, {
            ...rest,
            count: 0,
            value: 0,
            breakdown: []
          });
        }

        const existingToken = { ...nftCollectionMap.get(collectionName) };
        const currentBreakdown = existingToken.breakdown;

        // Find the index of the wallet address in the breakdown array
        const walletIndex = currentBreakdown.findIndex(item => item.walletAddress === walletAddress);

        nftCollectionMap.set(collectionName, {
          ...existingToken,
          nfts: [...(existingToken.nfts || []), ...nfts],
          count: existingToken.count + 1,
          value: existingToken.value + value,
          breakdown: walletIndex !== -1
            ? currentBreakdown.map((item, index) =>
              index === walletIndex
                ? { ...item, value: item.value + value }
                : item
            )
            : [...currentBreakdown, { walletAddressShort: this._utils.addrUtil(walletAddress).addrShort, walletAddress, value }]
        })


      });
    });

    return Array.from(nftCollectionMap.values())
  })

  /**
   * Aggregates NFT data into collections based on their names.
   *
   * This method processes an array of NFT objects and groups them by collection name.
   * It calculates aggregate values such as total value, count of listed tokens, and minimum floor price.
   *
   * @param {NFT[]} nfts - An array of NFT objects to process.
   * @returns {NftTable[]} An array of aggregated collection data.
   */
  private nftDataAggregator(nfts: NFT[]): NftTable[] {
    if (nfts == null)
      return [];

    const nftMap = new Map<string, any>()

    const collections = nfts.reduce((acc, nft) => {
      const collectionName = nft.collection.name || nft.collectionMagicEdenStatSymbol?.replace(/_/g, ' ') || 'unknown';
      const collectionSymbol = nft.collection.symbol || nft.collectionMagicEdenStatSymbol || '';
      let existingCollection = nftMap.get(collectionName.toLowerCase());

      if (existingCollection) {
        existingCollection.nfts.push(nft);
        existingCollection.value += (Number(nft.floorPrice) || 0) * this.solPrice();
        existingCollection.listed += nft.listStatus === "listed" ? 1 : 0;
        existingCollection.floorPrice = Math.min(existingCollection.floorPrice, Number(nft.floorPrice) || Infinity);
      } else {
        existingCollection = {
          collectionName,
          collectionSymbol,
          // collectionKey,
          nfts: [nft],
          value: (Number(nft.floorPrice) || 0) * this.solPrice(),
          imageUri: nft.collection.image_uri,
          listed: nft.listStatus === "listed" ? 1 : 0,
          floorPrice: Number(nft.floorPrice) || 0
        }
        acc.push(existingCollection);
      }
      nftMap.set(collectionName?.toLowerCase(), existingCollection);

      return acc;
    }, []);

    const mergedCollections = collections.map(({collectionSymbol, collectionKey, ...rest}) => rest);
    return mergedCollections.sort((a, b) => b.value - a.value);
  }

  /**
   * Gets the total portfolio value in USD.
   *
   * @type {Signal<number>}
   * @readonly
   * @description
   * This computed property returns a Signal that represents the total portfolio value
   * in USD. It calculates this by summing up the values of all enabled assets
   * in the portfolio, excluding those marked for exclusion.
   *
   * @returns {Signal<number>} A Signal representing the total portfolio value in USD.
   */
  public portfolioTotalUsdValue: Signal<number> = computed(() => {
    const assets = this.getEnabledWalletsAssets();
    if (!assets) return 0;

    return assets
      .filter(data => data?.value && !this.excludedAssets().has(data?.label))
      .reduce((accumulator, currentValue) => accumulator + currentValue.value, 0);
  });

  /**
   * Gets the total portfolio value in SOL.
   *
   * @type {Signal<number>}
   * @readonly
   * @description
   * This computed property returns a Signal that represents the total portfolio value
   * converted to SOL. It calculates this by dividing the portfolio total USD value
   * by the current SOL price.
   *
   * @returns {Signal<number>} A Signal representing the total portfolio value in SOL.
   */
  public portfolioValueInSOL: Signal<number> = computed(() =>
    this.portfolioTotalUsdValue() / this._jupStore.solPrice())

  /**
   * Toggles the exclusion status of an asset group.
   *
   * @param {string} group - The name of the asset group to toggle.
   * @returns {void}
   *
   * @remarks
   * This method normalizes the input group name, then updates the excludedAssets
   * Set accordingly. If the group is already excluded, it will be added back;
   * otherwise, it will be excluded.
   */
  toggleAssetExclusion(group: string): void {
    const normalizedGroup = group.replace(/\s+/g, '');
    this.excludedAssets.update(set => {
      const newSet = new Set(set);
      if (newSet.has(normalizedGroup)) {
        newSet.delete(normalizedGroup);
      } else {
        newSet.add(normalizedGroup);
      }
      return newSet;
    });
  }

  /**
   * Gets an array of enabled portfolios.
   *
   * @type {Signal<WalletEntry[]>}
   * @readonly
   * @description
   * This computed property returns a Signal that contains an array of portfolios
   * where each portfolio has an enabled status set to true.
   *
   * @returns {Signal<WalletEntry[]>} A Signal representing an array of enabled portfolios.
   */
  public getEnabledPortfolio: Signal<WalletEntry[]> = computed(() => {
    return this._portfolioService.portfolio()
      .filter(({portfolio}) => portfolio.enabled)
  });


}
