import { Injectable, computed, signal } from '@angular/core';
import { StashAsset } from '../stash.model';
import { createBurnCheckedInstruction, createCloseAccountInstruction } from "../../../../../node_modules/@solana/spl-token";
import { PublicKey } from '@solana/web3.js';
import { HelpersService } from './helpers.service';
import { TransactionInstruction } from '@solana/web3.js';
import { PremiumActions } from "@app/enums";
import { FreemiumService } from "@app/shared/layouts/freemium";


@Injectable({
  providedIn: 'root'
})
export class ZeroValueAssetsService {
  constructor(private _helpersService: HelpersService,
              private _freemiumService: FreemiumService) {
    this.updateZeroValueAssets();
  }

  private zeroValueAssetsSignal = signal<any>(null);
  private allZeroValueAssets: any[] = [];

  public findZeroValueAssets = computed(() => {
    // const NFTsOnly = this._helpersService.portfolioService.nfts();
    // const tokensOnly = this._helpersService.portfolioService.tokens();
    const additionalAssets = this.zeroValueAssetsSignal();
    if (!additionalAssets) return null;

    const buffer = 1.5
    const rentFeeInUSD = this._helpersService.rentFee * this._helpersService.jupStoreService.solPrice() * buffer;

    const additionalZeroValueAssetsFinalized = additionalAssets
      // filter frozen assets and asset with balance
      .filter(asset => !asset.frozen)
      // .filter(asset => !asset.frozen && asset.value < rentFeeInUSD)

      .map((asset, index) => {
        // const tempMint = asset.mint
        asset.id = index;
        asset.type = 'value-deficient';
        // swap mint and address on empty accounts due to inconsistency in the of address as ATA address and account address
        // asset.mint = asset.address
        // asset.address = tempMint
        return asset;
      })
      // .filter(asset => {
      //   const existsInTokens = tokensOnly?.filter(token => token.address === asset.mint).filter(token => Number(token.value) > rentFeeInUSD);

      //   const existsInNFTs = NFTsOnly?.filter(nft => nft.mint === asset.mint).filter(nft => nft.floorPrice > 0.001);

      //   return existsInTokens || existsInNFTs
      // })
      .filter(asset => {
        // const blackList = ['RLC', 'OWP', 'Orca Whirlpool Position', 'Raydium Concentrated Liquidity'];
        // hide orca whirlpool position and raydium concentrated liquidity lp positions with balance of 1
        if (!(asset.decimals === 0 && asset.balance === 1)) {
          // it's not an LP position with balance of 1, so include it
          return asset;
        }
      })

      .map(asset => this._helpersService.mapToStashAsset(asset, asset.type));


    // todo add desc "or with balance but no market value found." once we add tokens with balance
    return this._helpersService.createStashGroup(
      'zero value assets',
      "Zero value NFTs and token accounts",
      "Close",
      additionalZeroValueAssetsFinalized
    );
  });





  async updateZeroValueAssets(forceDelay: boolean = false) {
    // console.time('updateZeroValueAssets');
    // if(forceDelay) await this._helpersService.utils.sleep(5000)
    // console.timeEnd('updateZeroValueAssets');
    const zeroValueAssets = await this._helpersService.getDASAssets();

    if (zeroValueAssets) {
      this.allZeroValueAssets = zeroValueAssets;
      const filteredZeroValueAssets = zeroValueAssets.filter(acc => acc.balance === 0);
      this.zeroValueAssetsSignal.set(filteredZeroValueAssets);
    }
  }

  async getZeroValueAssetsByBalance(showAssetWithBalance: boolean = false) {
    const zeroValueAssets = !showAssetWithBalance
      ? this.allZeroValueAssets.filter(acc => acc.balance === 0)
      : this.allZeroValueAssets;
    this.zeroValueAssetsSignal.set(zeroValueAssets);
  }




  public async burnAccounts(accounts: StashAsset[], walletOwner: PublicKey, simulate: boolean = false) {
    const instructions: TransactionInstruction[] = [];

    await Promise.all(accounts.filter(acc => acc.balance !== 0).map(async acc => {
      instructions.push(createBurnCheckedInstruction(
        new PublicKey(acc.mint.addr),
        new PublicKey(acc.account.addr),
        walletOwner,
        BigInt(Math.floor(acc.balance * 10 ** acc.decimals)),
        acc.decimals,
      ));
    }));

    await Promise.all(accounts.map(async acc => {
      instructions.push(createCloseAccountInstruction(
        new PublicKey(acc.mint.addr),
        walletOwner,
        walletOwner
      ));
    }));
    return await this._helpersService._simulateBulkSendTx(instructions.flat(), this._freemiumService.getDynamicPlatformFeeInSOL(PremiumActions.STASH))
  }
}
