import { Injectable, signal, WritableSignal } from '@angular/core';
import { UtilService } from './util.service';
import { SolanaHelpersService } from './solana-helpers.service';
import { ApiService } from './api.service';
import { StakePool, WalletExtended, DirectStake, Validator, Stake } from '../models';
import { Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { BN, Marinade, MarinadeConfig, getRefNativeStakeSOLTx } from '@marinade.finance/marinade-ts-sdk';
import { depositSol, withdrawStake, stakePoolInfo, depositStake, DepositSolParams } from '@solana/spl-stake-pool';
import { TxInterceptorService } from './tx-interceptor.service';
import { NativeStakeService } from './native-stake.service';
import { MarinadeResult } from '@marinade.finance/marinade-ts-sdk/dist/src/marinade.types';
import { depositSolIntoSanctum, depositStakeIntoSanctum, withdrawStakeFromSanctum } from './sanctum';
// import { vSOLdirectStake } from './vSOL/set-validator-directed-stake';
import { ToasterService } from './toaster.service';
import { PremiumActions } from "@app/enums";
import { Subject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class LiquidStakeService {

  readonly restAPI = this._utils.serverlessAPI
  public stakePools: StakePool[] = []
  public hubSOLpool: WritableSignal<StakePool> = signal(null);
  public marinadeSDK: Marinade;
  public _triggerUpdate = new Subject<{ type: 'full' | 'partial' }>()
  private readonly _hubSOLConfig = {
    "poolName": "SolanaHub staked SOL",
    "tokenSymbol": "hubSOL",
    "tokenImageURL": "https://arweave.net/RI0OfNg4Ldn5RRdOp9lE60NqUmweGtJxF5N8JjU_Y0k",
    "poolPublicKey": "ECRqn7gaNASuvTyC5xfCUjehWZCSowMXstZiM5DNweyB",
    "tokenMint": "HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX",
    "type": "SanctumSpl"
  }
  constructor(
    private _txi: TxInterceptorService,
    private _shs: SolanaHelpersService,
    private _utils: UtilService,
  ) {
    this.getStakePoolList()
  }
  private _initMarinade(publicKey: PublicKey) {

    const config = new MarinadeConfig({
      connection: this._shs.connection,
      publicKey,
      // referralCode: new PublicKey('9CLFBo1nsG24DNoVZvsSNEYRNGU1LAHGS5M3o9Ei33o6'),
    })
    this.marinadeSDK = new Marinade(config)
  }

  public async getStakePoolList(): Promise<StakePool[]> {
    let stakePools: StakePool[] = [];
    if (this.stakePools.length > 0) {
      return this.stakePools
    }
    try {
      const result = await (await fetch(`${this.restAPI}/api/stake/get-stake-pools`)).json();
      stakePools = result //result.filter(s => poolIncludes.includes(s.poolName.toLowerCase()));
      this.stakePools = result;
      this.hubSOLpool.set(result.find((s: StakePool) => s.tokenMint === "HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX"))
    }
    catch (error) {
      console.error(error);
    }
    return stakePools
  }

// stake SOL into hubSOL LST
  public async stakeSOL(lamports: number, walletOwnerPK: PublicKey) {
    const record = {
      message: 'liquid stake',
      data: {
        pool: 'SolanaHub staked SOL',
        amount: lamports / LAMPORTS_PER_SOL
      }
    }
    try {
      let depositTx = await depositSolIntoSanctum(
        this._shs.connection,
        new PublicKey(this._hubSOLConfig.poolPublicKey), // pool address
        walletOwnerPK,
        lamports,
        undefined,
        undefined,
        undefined
      );
      const res = await this._txi.sendTx(depositTx.instructions, walletOwnerPK, depositTx.signers, record)
      if (res) {
        this._triggerUpdate.next({ type: 'partial' })
      }
      return res
    } catch (error) {
      console.error(error);
      return null
    }

  }


  // deposit stake account into hubSOL LST
  public async depositStakeAccount(walletOwnerPK: PublicKey, stakeAccount: string) {
    const validatorVoteAccount = new PublicKey('7K8DVxtNJGnMtUY1CQJT5jcs8sFGSZTDiG7kowvFpECh');
    console.log(this._hubSOLConfig.poolPublicKey, walletOwnerPK, stakeAccount);
    
    let depositTx = await depositStakeIntoSanctum(
      this._shs.connection,
      new PublicKey(this._hubSOLConfig.poolPublicKey),
      walletOwnerPK,
      validatorVoteAccount,
      new PublicKey(stakeAccount)
    );
    const record = {
      message: 'liquid stake', data: { pool: 'SolanaHub staked SOL' }
    }
    const res = await this._txi.sendTx(depositTx.instructions, walletOwnerPK, depositTx.signers, record)
    if (res) {
      this._triggerUpdate.next({ type: 'full' })
    }
    return res
  }



  // unstake SOL from any STAKE POOL
  public unstakeAccount = signal<PublicKey>(null);
  public async unstake(pool: StakePool, sol: number): Promise<{signature: string, stakeAccount: PublicKey} | null> {

    const { publicKey } = this._shs.getCurrentWallet()
    const lamports = (sol * LAMPORTS_PER_SOL)
    console.log(lamports, Number(sol))
    const record = { message: `liquid unstake`, data: { pool: pool.poolName, amount: sol } };
    if (pool.poolName.toLowerCase() == 'marinade') {
      if (!this.marinadeSDK) {
        this._initMarinade(publicKey)
      }
      const { transaction } = await this.marinadeSDK.liquidUnstake(new BN(lamports))
      // sign and send the `transaction`
      await this._txi.sendTx([transaction], publicKey, null, record, PremiumActions.UNSTAKE_LST)
    } else if (pool.type === 'SanctumSpl' || pool.type === 'SanctumSplMulti') {

      const singalValidatorsPool_PROGRAM_ID = new PublicKey('SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY')
      const MultiValidatorsPool_PROGRAM_ID = new PublicKey('SPMBzsVUuoHA4Jm6KunbsotaahvVikZs1JyTW6iJvbn')
      const STAKE_POOL_PROGRAM_ID = pool.type === 'SanctumSpl' ? singalValidatorsPool_PROGRAM_ID : MultiValidatorsPool_PROGRAM_ID
      let transaction = await withdrawStakeFromSanctum(
        STAKE_POOL_PROGRAM_ID,
        this._shs.connection,
        new PublicKey(pool.poolPublicKey),
        publicKey,
        Number(sol),
        false
      );
      
      this.unstakeAccount.set(transaction.signers[1].publicKey)
      const res = await this._txi.sendTx(transaction.instructions, publicKey, transaction.signers, record, PremiumActions.UNSTAKE_LST)
      if(res){
        this._triggerUpdate.next({type:'full'})
      }else{
        this.unstakeAccount.set(null)
      }
      return {signature: res, stakeAccount: transaction.signers[1].publicKey}
    } else {

      let transaction = await withdrawStake(
        this._shs.connection,
        new PublicKey(pool.poolPublicKey),
        publicKey,
        Number(sol),
        false
      );
      const res = await this._txi.sendTx(transaction.instructions, publicKey, transaction.signers, record, PremiumActions.UNSTAKE_LST)
      if(res){
        this._triggerUpdate.next({type:'full'})
      }
      return {signature: res, stakeAccount: transaction.signers[1].publicKey}

    }
    return null
  }

}
