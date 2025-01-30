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
import { vSOLdirectStake } from './vSOL/set-validator-directed-stake';
import { ToasterService } from './toaster.service';
import { PremiumActions } from "@app/enums";

@Injectable({
  providedIn: 'root'
})
export class LiquidStakeService {

  readonly restAPI = this._utils.serverlessAPI
  public stakePools: StakePool[] = []
  public hubSOLpool: WritableSignal<StakePool> = signal(null);
  public marinadeSDK: Marinade;
  constructor(
    private _toasterService: ToasterService,
    private _nss: NativeStakeService,
    private _txi: TxInterceptorService,
    private _shs: SolanaHelpersService,
    private _utils: UtilService,
    private _apiService: ApiService,
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
    if(this.stakePools.length > 0){
      return this.stakePools
    }
    try {
      const result = await (await fetch(`${this.restAPI}/api/get-stake-pools`)).json();
      stakePools = result //result.filter(s => poolIncludes.includes(s.poolName.toLowerCase()));
      this.stakePools = result;
      this.hubSOLpool.set(result.find((s: StakePool) => s.tokenMint === "HUBsveNpjo5pWqNkH57QzxjQASdTVXcSK7bVKTSZtcSX"))
    }
    catch (error) {
      console.error(error);
    }
    return stakePools
  }
  public updateSolBlazePool(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        let result = await (await fetch(
          "https://stake.solblaze.org/api/v1/update_pool?network=mainnet-beta"
        )).json();
        if (result.success) {
          resolve();
        } else {
          reject();
        }
      } catch (err) {
        reject();
      }
    });
  }

  public async stake(pool: StakePool, lamports: number, walletOwnerPK: PublicKey, validatorVoteAccount?: string) {

    const record = { message: 'liquid stake', data: { pool: pool.poolName, amount: Number(lamports.toString()) / LAMPORTS_PER_SOL, validatorVoteAccount } }

    const lamportsBN = new BN(lamports);
    const poolName = pool.poolName.toLowerCase()
    if (poolName === 'marinade') {
      if (!this.marinadeSDK) {
        this._initMarinade(walletOwnerPK)
      }
      return await this._marinadeStakeSOL(lamportsBN, walletOwnerPK, validatorVoteAccount, record)
    } else {
      return await this._stakePoolStakeSOL(new PublicKey(pool.poolPublicKey), walletOwnerPK, lamportsBN, validatorVoteAccount, poolName, record)
    }
  }
  private async _marinadeStakeSOL(lamports: BN, walletOwnerPK: PublicKey, validatorVoteAccount?: string, record?) {
    try {

      const { transaction } = await this.marinadeSDK.deposit(lamports);
      let ixs: any = [transaction]
      const directToValidatorVoteAddress = validatorVoteAccount ? new PublicKey(validatorVoteAccount) : null;
      if (directToValidatorVoteAddress) {
        const directStakeIx = await this.marinadeSDK.createDirectedStakeVoteIx(directToValidatorVoteAddress)
        ixs.push(directStakeIx)
      }



      return await this._txi.sendTx([...ixs], walletOwnerPK, null, record)
    } catch (error) {
      console.log(error);
    }
    return null
  }
  private async _stakePoolStakeSOL(
    poolPublicKey: PublicKey,
    walletOwnerPK: PublicKey,
    sol: BN,
    validatorVoteAddress: string,
    poolName: string,
    record
  ) {
    let ix = await depositSol(
      this._shs.connection,
      poolPublicKey,
      walletOwnerPK,
      Number(sol),
      undefined,
      // referral
      // new PublicKey(environment.platformATAbSOLFeeCollector)
    );
    let ixs: any = [ix]

    let txId;
    if (validatorVoteAddress) {
      if (poolName === 'solblaze') {
        const ix2 = this.stakeCLS(validatorVoteAddress, walletOwnerPK);
        ixs.push(ix2)
        txId = await this._txi.sendTx(ixs, walletOwnerPK, ix.signers, record);
        await fetch(`https://stake.solblaze.org/api/v1/cls_stake?validator=${validatorVoteAddress}&txid=${txId}`);
      }

      if (poolName === 'the vault') {
        const wallet = this._shs.getCurrentWallet()
        const ix2 = await this.setvSOLDirectStake(wallet, validatorVoteAddress)

        ixs.push(...ix2)
        console.log(ixs);
        txId = await this._txi.sendTx(ixs, walletOwnerPK, ix.signers, record);
      }
    }
    return txId


  }

  public async depositStakeHubSolPool(walletOwnerPK: PublicKey, stakeAccountPK: PublicKey) {
    const validatorVoteAccount = new PublicKey('7K8DVxtNJGnMtUY1CQJT5jcs8sFGSZTDiG7kowvFpECh');
    let depositTx = await depositStakeIntoSanctum(
      this._shs.connection,
      new PublicKey('ECRqn7gaNASuvTyC5xfCUjehWZCSowMXstZiM5DNweyB'),
      walletOwnerPK,
      validatorVoteAccount,
      stakeAccountPK
    );
    const record = {
      message: 'liquid stake', data: { pool: 'SolanaHub staked SOL' }
    }
    await this._txi.sendTx(depositTx.instructions, walletOwnerPK, depositTx.signers, record)
  }
  public async depositSolHubSolPool(walletOwnerPK: PublicKey, lamports: number) {

    const record = {
      message: 'liquid stake', data: {
        pool: 'SolanaHub staked SOL',
        amount: lamports / LAMPORTS_PER_SOL
      }
    }
    let depositTx = await depositSolIntoSanctum(
      this._shs.connection,
      new PublicKey('ECRqn7gaNASuvTyC5xfCUjehWZCSowMXstZiM5DNweyB'), // pool address
      walletOwnerPK,
      lamports,
      undefined,
      undefined,
      undefined
    );
    return await this._txi.sendTx(depositTx.instructions, walletOwnerPK, depositTx.signers, record)
  }

  public async getDirectStake(walletAddress): Promise<DirectStake> {
    let directStake: DirectStake = { mSOL: null, bSOL: null };
    try {
      const validators = await this._shs.getValidatorsList();

      const result: DirectStake = await (await fetch(`${this.restAPI}/api/get-direct-stake?walletAddress=${walletAddress}`)).json();

      result.vSOL ? directStake.vSOL.validator = validators.find((v: Validator) => v.vote_identity === result.vSOL.validatorVoteAccount) : null
      result.bSOL ? directStake.bSOL.map(s => s.validator = validators.find((v: Validator, i) => v.vote_identity === result.bSOL[i].validatorVoteAccount)) : null;
      directStake = result;

      //  directStake.mSOL.validator = mSOLvalidator
      //  directStake.bSOL.map(s=> s.validator = bSOLvalidator)// .validator = mSOLvalidator
    }
    catch (error) {
      console.error(error);
    }
    return directStake
  }
  async setvSOLDirectStake(wallet, validatorVoteAddress: string): Promise<TransactionInstruction[]> {

    // this._toasterService.msg.next({
    //   message: 'Validator direct stake set',
    //   segmentClass: 'toastInfo'
    // })
    console.log(wallet, validatorVoteAddress);

    return await vSOLdirectStake(wallet, this._shs.connection, validatorVoteAddress)
  }
  async stakePoolStakeAccount(stakeAccount: Stake, pool: StakePool) {
    console.log(stakeAccount, pool);

    const { publicKey } = this._shs.getCurrentWallet()
    // let { stakeAccount, validatorVoteAccount } = this.stakeForm.value;
    const record = {
      message: 'liquid stake', data: {
        pool: pool.poolName,
        amount: stakeAccount.balance,
        validatorVoteAccount: stakeAccount.validator.vote_identity
      }
    }
    const validatorVoteAccount = new PublicKey(stakeAccount.validator.vote_identity);
    const stakeAccountPK = new PublicKey(stakeAccount.address);

    try {
      if (pool.poolName.toLowerCase() == 'marinade') {
        if (!this.marinadeSDK) {
          this._initMarinade(publicKey)
        }
        const depositAccount: MarinadeResult.DepositStakeAccount = await this.marinadeSDK.depositStakeAccount(stakeAccountPK);
        const txIns: Transaction = depositAccount.transaction
        await this._txi.sendTx([txIns], publicKey, null, record);
      } else if (pool.poolName.toLowerCase() == 'solanahub staked sol') {
        console.log('depositStakeHubSolPool');

        this.depositStakeHubSolPool(publicKey, stakeAccountPK)
      }

      else {

        let ix = await depositStake(
          this._shs.connection,
          new PublicKey(pool.poolPublicKey),
          publicKey,
          validatorVoteAccount,
          stakeAccountPK
        );
        let ixs: any = [ix]

        const ix2 = this.stakeCLS(validatorVoteAccount.toBase58(), publicKey);
        ixs.push(ix2)


        const txId = await this._txi.sendTx(ixs, publicKey, ix.signers, record);
        if (validatorVoteAccount) {
          await fetch(`https://stake.solblaze.org/api/v1/cls_stake?validator=${validatorVoteAccount}&txid=${txId}`);
        }
        return txId


      }
    } catch (error) {
      console.error(error);

      // const toasterMessage: toastData = {
      //   message: error.toString().substring(6),
      //   segmentClass: "merinadeErr"
      // }
      // this._toasterService.msg.next(toasterMessage)
      return null
    }
    return null
  }

  public stakeCLS = (validatorVoteAccount: string, publicKey) => {
    let memo = JSON.stringify({
      type: "cls/validator_stake/lamports",
      value: {
        validator: new PublicKey(validatorVoteAccount)
      }
    });
    let memoInstruction = new TransactionInstruction({
      keys: [{
        pubkey: publicKey,
        isSigner: true,
        isWritable: true
      }],
      programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
      data: (new TextEncoder()).encode(memo) as Buffer
    })
    return memoInstruction

  }

  public async unstake(pool: StakePool, sol: number): Promise<string | null> {


    const { publicKey } = this._shs.getCurrentWallet()
    const lamports = (sol * LAMPORTS_PER_SOL).toString().split(".")[0]

    const record = { message: `liquid unstake`, data: {pool: pool.poolName, amount: sol } };
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

      const tx = await this._txi.sendTx(transaction.instructions, publicKey, transaction.signers, record, PremiumActions.UNSTAKE_LST)
      return tx
    } else {

      let transaction = await withdrawStake(
        this._shs.connection,
        new PublicKey(pool.poolPublicKey),
        publicKey,
        Number(sol),
        false
      );

      const tx = await this._txi.sendTx(transaction.instructions, publicKey, transaction.signers, record, PremiumActions.UNSTAKE_LST)
      return tx

    }
    return null
  }
  private _floorLastDecimal(num) {
    const decimalPlaces = num.toString().split('.')[1]?.length || 0;
    if (decimalPlaces > 3) {
      return Math.floor(num * 10000) / 10000;
  }

  return num;
}
}
