import { Injectable, signal } from '@angular/core';
import { JupStoreService, UtilService, SolanaHelpersService, TxInterceptorService } from 'src/app/services';
import { StashAsset, StashGroup } from '../stash.model';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { environment } from 'src/environments/environment';
import { EarningsService } from './earnings.service';
import { FreemiumService } from "@app/shared/layouts/freemium";
import {JupToken, SwapToken } from "@app/models";
import {ModelsAdapterService, TxHelperService} from "@app/shared/services";

@Injectable({
    providedIn: 'root'
})
export class HelpersService {
    public rentFee = 0.002039
    public dasAssets = signal([])

    constructor(
        public shs: SolanaHelpersService,
        public txi: TxInterceptorService,
        public utils: UtilService,
        public jupStoreService: JupStoreService,
        public earningsService: EarningsService,
        public freemiumService: FreemiumService,
        public modelsAdapterService: ModelsAdapterService,
        public transactionHelperService: TxHelperService
    ) {
        // this.getDASAssets()
    }

    public async getDASAssets() {
        const { publicKey } = this.shs.getCurrentWallet()
        try {
            // const onlyEmptyAccounts = true
            const unknownAssets = await (await fetch(`${this.utils.serverlessAPI}/api/portfolio/get-assets?walletAddress=${publicKey.toBase58()}`)).json()
            // remove token with no symbol
            // const unknownAssetsFiltered = unknownAssets.filter(acc => acc.symbol !== '')
            this.dasAssets.set(unknownAssets)
            return unknownAssets
        } catch (error) {
            console.error('error', error);
            return null
        }
    }



    public createStashGroup = (
        label: string,
        description: string,
        actionTitle: string,
        assets: StashAsset[]
    ): StashGroup => {
        const group: StashGroup = {
            label,
            description,
            actionTitle,
            value: 0,
            data: { assets }
        };

        group.value = assets.reduce((acc, curr) =>
            acc + (curr.value || curr.extractedValue?.SOL * this.jupStoreService.solPrice() || 0), 0);
        return group;
    }

    public mapToStashAsset = (
        item: any,
        category: 'value-deficient' | 'stake' | 'defi' | 'dust',
        extraData: Record<string, any> = {}
    ): StashAsset => {
        const baseAsset = {
            id: item.id,
            checked: false,
            name: category === 'stake' ? item.validator?.name : item.name,
            symbol: item.symbol,
            logoURI: category === 'stake' ? item.validator?.image : item.logoURI,
            url: this.utils.explorer + '/account/' + (category === 'stake' ? item?.address : item.mint),
            mint: item.mint ? this.utils.addrUtil(item.mint) : this.utils.addrUtil(item.address),
            decimals: item?.decimals,
            account: this.utils.addrUtil(item['address'] || 'default'),
            balance: item.balance,
            action: this.getActionByCategory(category),
            type: this.getTypeByCategory(category),
            source: this.getSourceByCategory(category, item.balance, item.type),
            ...extraData
        };

        switch (category) {
            case 'dust':
                return {
                    ...baseAsset,
                    value: Number(item.value) || 0,
                    extractedValue: { SOL: item.value / this.jupStoreService.solPrice() }
                };
            case 'defi':
                const defiAsset = {
                    ...baseAsset,
                    name: item.poolPair,
                    symbol: item.poolPair,
                    logoURI: [item.poolTokenA.logoURI, item.poolTokenB.logoURI],
                    tokens: [item.poolTokenA, item.poolTokenB].map(this.modelsAdapterService.mapToTokenInfo),
                    platform: item.platform,
                    platformLogoURI: item.platformLogoURI,
                    value: item.pooledAmountAWithRewardsUSDValue + item.pooledAmountBWithRewardsUSDValue,
                    extractedValue: {
                        [item.poolTokenA.symbol]: Number(this.utils.fixedNumber(item.pooledAmountAWithRewards)),
                        [item.poolTokenB.symbol]: Number(this.utils.fixedNumber(item.pooledAmountBWithRewards))
                    },
                    positionData: item.positionData

                };
                if (item.accountRentFee) {
                    const solValue = Number(defiAsset.extractedValue['SOL']) || 0
                    defiAsset.extractedValue['SOL'] = solValue + Number(item.accountRentFee)
                    defiAsset.value = defiAsset.value + (Number(item.accountRentFee) * this.jupStoreService.solPrice())
                }
                // filter out all extracted values that are 0
                defiAsset.extractedValue = Object.fromEntries(
                    Object.entries(defiAsset.extractedValue).filter(([_, value]) => Number(value) !== 0)
                );
                return defiAsset
            case 'stake':
                return {
                    ...baseAsset,
                    balance: item.inactive_stake ,
                    extractedValue: { SOL: item.inactive_stake  }
                };
            default:
                return {
                    ...baseAsset,
                    extractedValue: { SOL: this.rentFee }
                };
        }
    }

    public getActionByCategory = (category: string): string => {
        const actions = {
            defi: 'Withdraw & Close',
            stake: 'harvest',
            dust: 'swap',
            default: 'close'
        };
        return actions[category] || actions.default;
    }

    public getTypeByCategory = (category: string): string => {
        const types = {
            defi: 'defi-position',
            stake: 'stake-account',
            dust: 'dust-value',
            default: 'value-deficient'
        };
        return types[category] || types.default;
    }
    private getSourceByCategory(category: string, balance: number, type): string {
        // const defiType = type === 'out of range' ? 'out of range' : 'no liquidity';
        const sources = {
            defi: type,
            stake: 'excess balance',
            dust: 'dust value',
            default: balance === 0 ? 'empty account' : 'unknown value'
        };
        return sources[category] || sources.default;
    }

    public async _simulateBulkSendTx(
        ixs: TransactionInstruction[] | VersionedTransaction[] | Transaction[],
        platformFeeInSOL: number
    ): Promise<string[]> {
      let transactions: (Transaction | VersionedTransaction)[] =  await this.transactionHelperService.toTransactions(ixs);

      if (!this.freemiumService.isPremium()) {
        // Add platform fee to each transaction
        if (ixs[0] instanceof VersionedTransaction) {
            // Add a single fee transaction for versioned transactions
            const platformFeeP = Math.floor(platformFeeInSOL * LAMPORTS_PER_SOL);
            const platformFeeTxsVersioned = await this._addPlatformFeeTx('versionedTx', platformFeeP);
            transactions.push(platformFeeTxsVersioned as VersionedTransaction);
        } else {
            // Calculate platform fee per transaction
            const platformFeePerTx = Math.floor(platformFeeInSOL * LAMPORTS_PER_SOL / transactions.length);
            const platformFeeTxsIn = await this._addPlatformFeeTx('instructions', platformFeePerTx);
            // Add fee to each legacy transaction
            for (const tx of transactions) {
                (tx as Transaction).add(...platformFeeTxsIn as TransactionInstruction[]);
            }
        }
      }

        // Send transactions
        try {
            const signatures = await this.txi.sendMultipleTxn(transactions);
            return signatures;
        } catch (error) {
            console.error('Error sending transactions:', error);
            return [];
        }
    }

   public async getVersionedTransactions(tokens: SwapToken[], swapToHubsol: boolean = false): Promise<VersionedTransaction[]> {
     const swapencodedIx = await Promise.all(tokens.map(async token => {
        const { address, decimals, symbol, name, balance } = token;
        const logoURI = Array.isArray(token.logoURI) ? token.logoURI[0] : token.logoURI;
        const chainId = 101;

        const jupToken =
          {
            chainId,
            address,
            logoURI,
            decimals,
            symbol,
            name
          };

        let outputToken: JupToken = {
          chainId,
          address: 'So11111111111111111111111111111111111111112',
          logoURI,
          decimals,
          symbol: 'SOL',
          name: 'Solana'
        }

        if (swapToHubsol) {
          outputToken = {
            ...outputToken,
            address: 'HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX',
            name: 'SolanaHub Staked SOL',
            symbol: 'hubSOL'
          }
        }
        const bestRoute = await this.jupStoreService.computeBestRoute(
          balance,
          jupToken,
          outputToken,
          50
        );
        return await this.jupStoreService.swapTx(bestRoute)
      }));

     // Deserialize each transaction in the array
     console.log('swapencodedIx', swapencodedIx.flat());

     // filter null and flat
     return swapencodedIx.flat().filter(ix => ix !== null)
   }

    private async _addPlatformFeeTx(as: 'instructions' | 'versionedTx', platformFee: number): Promise<TransactionInstruction[] | VersionedTransaction> {
        const { publicKey } = this.shs.getCurrentWallet();
        const { blockhash } = await this.shs.connection.getLatestBlockhash();

        let referralFee = null
        let transferTxs: (TransactionInstruction | VersionedTransaction)[] = []
        if (this.earningsService.referralAddress()) {
            const sharedFee = 0.2
            let feeLessReferral = platformFee * sharedFee
            platformFee = Math.ceil(platformFee - feeLessReferral)
            // referral address gets 20% of platform fee
            referralFee = Math.ceil(feeLessReferral)
        }
        const transferPlatformFeeTx = SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(environment.platformFeeCollector),
            lamports: platformFee,
        })
        transferTxs.push(transferPlatformFeeTx)
        if (referralFee) {
            const transferReferralFeeTx = SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: new PublicKey(this.earningsService.referralAddress()),
                lamports: referralFee,
            })
            transferTxs.push(transferReferralFeeTx)
        }
        if (as === 'instructions') {
            return transferTxs as TransactionInstruction[]
        } else {
            const message = new TransactionMessage({
                payerKey: publicKey,
                recentBlockhash: blockhash,
                instructions: transferTxs as TransactionInstruction[], // Add your instructions here
            }).compileToV0Message();

            // Create the VersionedTransaction
            return new VersionedTransaction(message);
        }
    }
}
