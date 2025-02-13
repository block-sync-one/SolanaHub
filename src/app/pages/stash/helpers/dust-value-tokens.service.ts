import { Injectable, computed, effect, signal } from '@angular/core';
import { StashAsset, StashGroup } from '../stash.model';
import { HelpersService } from './helpers.service';
import { JupToken } from 'src/app/models/jup-token.model';
import { FreemiumService } from "@app/shared/layouts/freemium";
import { PremiumActions } from "@app/enums";

@Injectable({
  providedIn: 'root'
})
export class DustValueTokensService {
  private readonly dustValueStashGroupSignal = signal<StashGroup | null>(null);

  constructor(private readonly _helpersService: HelpersService, private _freemiumService: FreemiumService) {
    effect(() => {
      const assets = this._helpersService.dasAssets();
      if (assets) {
        this.updateDustValueTokens();
      }
    }, { allowSignalWrites: true });
  }

  public readonly dustValueTokens = computed(() => this.dustValueStashGroupSignal());

  public updateDustValueTokensWithShare(portfolioShare: number): void {
    this.updateDustValueTokens(portfolioShare);
  }

  private updateDustValueTokens(portfolioShare: number = 3): StashGroup | null {
    const tokens = this._helpersService.dasAssets();

    if (!tokens?.length) return null;

    const totalTokensValue = tokens.reduce((acc, curr) => acc + Number(curr.value), 0);
    const maxDustValue = totalTokensValue * (portfolioShare / 100);
    const buffer = 1.5
    const rentFeeUSD = this._helpersService.rentFee * this._helpersService.jupStoreService.solPrice() * buffer;

    const filterDustValueTokens = tokens
      .filter(token =>
        Number(token.value) <= maxDustValue &&
        Number(token.value) > rentFeeUSD &&
        // token.value > 0 &&
        token.decimals > 0 &&
        token.symbol !== 'SOL'
      )
      .map((token, index) => this._helpersService.mapToStashAsset({ ...token, id: index }, 'dust'));

    const dustTokens = this._helpersService.createStashGroup(
      'dust value',
      "Tokens value with up to 5% of your portfolio's total value.",
      "swap",
      filterDustValueTokens
    );

    this.dustValueStashGroupSignal.set(dustTokens);
    return dustTokens;
  }

  async bulkSwapDustValueTokens(tokens: StashAsset[], swapToHubsol: boolean = false) {
    try {
      const swapTokens = tokens.map((t) => ({ ...t, address: t.account.addr})).map(this._helpersService.mapToSwapInfo);
      const ixs = await this._helpersService.getVersionedTransactions(swapTokens, swapToHubsol);
      return await this._helpersService._simulateBulkSendTx(ixs, this._freemiumService.getDynamicPlatformFeeInSOL(PremiumActions.STASH))
    } catch (error) {
      console.log(error);
      return null
    }
  }
}
