import { Injectable, computed, signal } from '@angular/core';
import { StashAsset, StashGroup, OutOfRange } from '../stash.model';
import { PublicKey, Transaction } from '@solana/web3.js';
import { HelpersService } from './helpers.service';
import { PremiumActions } from "@app/enums";
import { FreemiumService } from "@app/shared/layouts/freemium";

@Injectable({
  providedIn: 'root'
})
export class OutOfRangeDeFiPositionsService {
  private outOfRangeDeFiPositionsSignal = signal<StashGroup | null>(null);

  constructor(
    private _helpersService: HelpersService,
    private _freemiumService: FreemiumService
  ) {
    this.updateOutOfRangeDeFiPositions();
  }

  public findOutOfRangeDeFiPositions = computed(() => {
    return this.outOfRangeDeFiPositionsSignal();
  });

  public async getOutOfRangeDeFiPositions(): Promise<OutOfRange[]> {
    const { publicKey } = this._helpersService.shs.getCurrentWallet();
    try {
      const getOutOfRange: OutOfRange[] = await (await fetch(`${this._helpersService.utils.serverlessAPI}/api/stash/out-of-range?address=${publicKey.toBase58()}`)).json();
      return getOutOfRange;
    } catch (error) {
      return null;
    }
  }

  public async updateOutOfRangeDeFiPositions() {
    const positions = await this.getOutOfRangeDeFiPositions();
    if (!positions) {
      this.outOfRangeDeFiPositionsSignal.set(null);
      return;
    }

    const stashGroup = this._helpersService.createStashGroup(
      'zero yield zones',
      "This dataset includes open positions in DeFi protocols that are not used and sit idle ready to be withdrawal.",
      "Withdraw & Close",
      positions.map((p, index) => this._helpersService.mapToStashAsset({ ...p, id: index }, 'defi'))
    );
    this.outOfRangeDeFiPositionsSignal.set(stashGroup);
  }


  async closeOutOfRangeDeFiPosition(positions: StashAsset[], walletOwner: PublicKey) {

    try {

      const positionsToClose = positions.filter(p => p.type === 'defi-position')
      const positionsData = positionsToClose.map(p => {
        return {
          ...p.positionData,
          platform: p.platform,
          source: p.source
        }
      })
      // get remove liquidity tx instructions
      const encodedIx = await (await fetch(`${this._helpersService.utils.serverlessAPI}/api/stash/close-positions`, {
        method: 'POST',
        body: JSON.stringify({ wallet: walletOwner.toBase58(), positions: positionsData })
      })).json()

      const txArray: Transaction[] = encodedIx.map(ix => Transaction.from(Buffer.from(ix, 'base64')).instructions).flat()
      return await this._helpersService._simulateBulkSendTx(txArray, this._freemiumService.getDynamicPlatformFeeInSOL(PremiumActions.STASH_OOR))

    } catch (error) {
      console.log(error);
      return null
    }
  }

}
