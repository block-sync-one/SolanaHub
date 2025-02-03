import { Injectable, computed, signal } from '@angular/core';
import { NativeStakeService } from 'src/app/services';
import { StashAsset } from '../stash.model';
import { HelpersService } from './helpers.service';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { StakeProgram } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import { Stake } from 'src/app/models';
import { PremiumActions } from "@app/enums";
import { FreemiumService } from "@app/shared/layouts/freemium";

@Injectable({
  providedIn: 'root'
})
export class StakeOverflowService {
  constructor(private _helpersService: HelpersService, private _nss: NativeStakeService, private _freemiumService: FreemiumService) {
    this.getStakeAccounts()
  }

  private _stakeAccounts = signal<Stake[]>(null)
  private getStakeAccounts = async () => {
    const {publicKey} = this._helpersService.shs.getCurrentWallet()
    const accounts = [] as any// await this._nss.getOwnerNativeStake(publicKey.toString());
    this._stakeAccounts.set(accounts)
  }
  public findStakeOverflow = computed(() => {
    const accounts = this._stakeAccounts();

    if (!accounts) return null;
    const transactionFee = 300000;
    const filterExceedBalance = accounts
      .filter(acc => acc.state === 'active' && acc.excessLamport > transactionFee && !acc.locked)
      .map(acc => this._helpersService.mapToStashAsset(acc, 'stake'));

    return this._helpersService.createStashGroup(
      'unstaked overflow',
      "Excess balance from your stake account mostly driven by MEV rewards that are not compounded.",
      "harvest",
      filterExceedBalance
    );
  });

  public async withdrawStakeAccountExcessBalance(accounts: StashAsset[], walletOwner: PublicKey) {
    const withdrawTx = accounts.map(acc => StakeProgram.withdraw({
      stakePubkey: new PublicKey(acc.account.addr),
      authorizedPubkey: walletOwner,
      toPubkey: walletOwner,
      lamports: acc.extractedValue.SOL * LAMPORTS_PER_SOL, // Withdraw the full balance at the time of the transaction
    }));
    const instructions = withdrawTx.map(ix => ix.instructions)
    const signatures = await this._helpersService._simulateBulkSendTx(instructions.flat(), this._freemiumService.getDynamicPlatformFeeInSOL(PremiumActions.STASH))
    if(signatures) {
      this.getStakeAccounts()
    }
    return signatures


    // this._nss.withdraw([account], publicKey, account.extractedValue.SOL * LAMPORTS_PER_SOL)
  }
}
