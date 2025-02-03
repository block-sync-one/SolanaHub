import { Injectable, signal } from '@angular/core';
import {
  AccountInfo,
  AuthorizeStakeParams,
  Authorized,
  CreateStakeAccountParams,
  DelegateStakeParams,
  InflationReward,
  Keypair,
  LAMPORTS_PER_SOL,
  Lockup,
  ParsedAccountData,
  PublicKey,
  RpcResponseAndContext,
  StakeActivationData,
  StakeProgram,
  Transaction,

} from '@solana/web3.js';
const { struct, u32, u8 } = require('@solana/buffer-layout');
import { SolanaHelpersService } from './solana-helpers.service';
import { TxInterceptorService } from './tx-interceptor.service';
import { Stake, StakeAccount, Validator, WalletExtended } from '../models';
import { UtilService } from './util.service';
import { PremiumActions } from "@app/enums";
import { Subject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class NativeStakeService {
  public _triggerUpdate = new Subject<boolean>()
  constructor(
    private _utils: UtilService,
    private _txi: TxInterceptorService,
    private _shs: SolanaHelpersService,
  ) { }
  readonly SolanaHubVoteKey: string = '7K8DVxtNJGnMtUY1CQJT5jcs8sFGSZTDiG7kowvFpECh';
  public async getSolanaHubValidatorInfo() {
    const validators = await this._shs.getValidatorsList()
    return validators.find(v => v.vote_identity === this.SolanaHubVoteKey)
  }

  public async deactivateStakeAccount(stakeAccountAddress: string, walletOwnerPk: PublicKey): Promise<string> {
    try {
      const deactivateTx: Transaction = StakeProgram.deactivate({
        stakePubkey: new PublicKey(stakeAccountAddress),
        authorizedPubkey: walletOwnerPk,
      });
      const record = { message: 'account', data: { action: 'deactivate account' } }
      const res = await this._txi.sendTx([deactivateTx], walletOwnerPk, null, record)
      if(res){
        this._triggerUpdate.next(true)
      }
      return res
    } catch (error) {
      console.log(error);

    }
    return null
  }

  public async transferStakeAccountAuth(
    stakePubkey: PublicKey,
    walletOwnerPk: PublicKey,
    newAuthorizedPubkey: PublicKey,
    authToTransfer: { stake: boolean, withdraw: boolean }
  ) {
    try {
      const transferAuthTx = [];
      if (authToTransfer.stake) {
        const authWithdraw: AuthorizeStakeParams = {
          stakePubkey,
          authorizedPubkey: walletOwnerPk,
          newAuthorizedPubkey,
          stakeAuthorizationType: { index: 0 },
        }
        transferAuthTx.push(StakeProgram.authorize(authWithdraw))
      }
      if (authToTransfer.withdraw) {
        const authStake: AuthorizeStakeParams = {
          stakePubkey,
          authorizedPubkey: walletOwnerPk,
          newAuthorizedPubkey,
          stakeAuthorizationType: { index: 1 },
        }
        transferAuthTx.push(StakeProgram.authorize(authStake))
      }

      const record = { message: 'account', data: { action: 'transfer account' } }

      const res = await this._txi.sendTx(transferAuthTx, walletOwnerPk, null, record)
      if (res) {
        this._triggerUpdate.next(true)
      }
      return res
    } catch (error) {
      console.log(error);
    }
    return null
  }

  public async splitStakeAccounts(walletOwnerPk: PublicKey, targetStakePubKey: PublicKey, keypair: Keypair, lamports: number) {
    const minimumAmount = await this._shs.connection.getMinimumBalanceForRentExemption(
      StakeProgram.space,
    );

    const createAccount = this.createStakeAccount(minimumAmount, walletOwnerPk, 0, keypair)

    try {
      const splitAccount: Transaction =
        StakeProgram.split({
          stakePubkey: targetStakePubKey,
          authorizedPubkey: walletOwnerPk,
          splitStakePubkey: createAccount.newStakeAccount.publicKey,
          lamports
        }, minimumAmount);

      const record = { message: 'account', data: { action: 'split account' } }
      const res = await this._txi.sendTx([splitAccount], walletOwnerPk, [createAccount.newStakeAccount], record, PremiumActions.SPLIT)
      if(res){
        this._triggerUpdate.next(true)
      }
      return res
    } catch (error) {
      console.log(error);
    }
    return null
  }
  public async mergeStakeAccounts(walletOwnerPk: PublicKey, targetStakePubkey: PublicKey, sourceStakePubKey: PublicKey[]) {

    try {
      const mergeAccounts: Transaction[] = sourceStakePubKey.map(sourceAcc => {
        return StakeProgram.merge({
          authorizedPubkey: walletOwnerPk,
          sourceStakePubKey: sourceAcc,
          stakePubkey: targetStakePubkey,
        });
      })
      const record = { message: 'account', data: { action: 'merge accounts' } }
      const res = await this._txi.sendTx(mergeAccounts, walletOwnerPk, null, record, PremiumActions.MERGE)
      if(res){
        this._triggerUpdate.next(true)
      }
      return res
    } catch (error) {
      console.log(error);
    }
    return null

  }

  public async withdraw(stakeAccount: StakeAccount[], walletOwnerPK: PublicKey, solAmount: number): Promise<any> {
    
    const withdrawTx = stakeAccount.map(acc => StakeProgram.withdraw({
      stakePubkey: new PublicKey(acc.address),
      authorizedPubkey: walletOwnerPK,
      toPubkey: walletOwnerPK,
      lamports: solAmount * LAMPORTS_PER_SOL, // Withdraw the full balance at the time of the transaction
    }));
    try {
      const record = { message: 'account', data: { action: 'withdraw stake' } }
      const res = await this._txi.sendTx([...withdrawTx], walletOwnerPK, null, record)
      if(res){
        this._triggerUpdate.next(true)
      }
      return res
    } catch (error) {
      console.error(error)
    }
  }
  public createStakeAccount(lamportToSend: number, walletOwnerPK: PublicKey, lockupDuration: number = 0, preConfigNewStakeAccount: Keypair = new Keypair()) {
    const fromPubkey = walletOwnerPK
    const newStakeAccount = preConfigNewStakeAccount
    const authorizedPubkey = walletOwnerPK
    const authorized = new Authorized(authorizedPubkey, authorizedPubkey);
    const lockup = new Lockup(lockupDuration, 0, fromPubkey);
    const lamports = lamportToSend;
    const stakeAccountIns: CreateStakeAccountParams = {
      fromPubkey,
      stakePubkey: newStakeAccount.publicKey,
      authorized,
      lockup,
      lamports
    }
    const newStakeAccountIns = StakeProgram.createAccount(stakeAccountIns)
    return { newStakeAccountIns, newStakeAccount }
  }

  public async stake(
    lamportsToDelegate: number,
    walletOwnerPK: PublicKey,
    validatorVoteKey: string,
    lockupDuration: number = 0
  ): Promise<string> {
    // const minimumAmount = await this._shs.connection.getMinimumBalanceForRentExemption(
    //   StakeProgram.space,
    // );
    // if (lamportsToDelegate < minimumAmount) {
    //   return null;
    //   // return this._formatErrors({ message: `minimum size for stake account creation is: ${minimumAmount / LAMPORTS_PER_SOL} sol` })
    // }

    try {
      const stakeAccountData = this.createStakeAccount(lamportsToDelegate, walletOwnerPK, lockupDuration)
      const stakeAcc: Keypair = stakeAccountData.newStakeAccount;
      const stakeAccIns: Transaction = stakeAccountData.newStakeAccountIns;
      const delegateTX: Transaction = this._delegateStakeAccount(stakeAcc.publicKey.toBase58(), validatorVoteKey, walletOwnerPK)

      const stakeIx: Transaction[] = [stakeAccIns, delegateTX]
      const record = { message: `native stake`, data: { validator: validatorVoteKey, amount: Number(lamportsToDelegate) / LAMPORTS_PER_SOL } }
      const res = await this._txi.sendTx(stakeIx, walletOwnerPK, [stakeAcc], record)
      if(res){
        this._triggerUpdate.next(true)
      }
      return res

    } catch (error) {
      console.warn(error)
    }
    return null
  }
  public async reStake(stakeAccount: StakeAccount, vote_identity: string, walletOwnerPK: PublicKey) {
    try {
      const delegateTX: Transaction = this._delegateStakeAccount(stakeAccount.address, vote_identity, walletOwnerPK)
      const record = { message: 'account', data: { action: 'reStake' } }

      const res = await this._txi.sendTx([delegateTX], walletOwnerPK, null, record)
      if(res){
        this._triggerUpdate.next(true)
      }
      return res

    } catch (error) {
      console.log(error);
    }
    return null
  }
  private _delegateStakeAccount(stakeAccountAddress: string, validatorVoteKey: string, walletOwnerPK: PublicKey): Transaction {
    try {
      const instruction: DelegateStakeParams = {
        stakePubkey: new PublicKey(stakeAccountAddress),
        authorizedPubkey: walletOwnerPK,
        votePubkey: new PublicKey(validatorVoteKey)
      }
      const delegateTX: Transaction = StakeProgram.delegate(instruction);
      return delegateTX;

    } catch (error) {
      console.error(error);
    }
    return null
  }


  // public async withdrawFromStakeAccount(stakeAccount: string, walletOwnerPK: PublicKey, lamports: number): Promise<any> {
  //   const withdrawTx = StakeProgram.withdraw({
  //     stakePubkey: new PublicKey(stakeAccount),
  //     authorizedPubkey: walletOwnerPK,
  //     toPubkey: walletOwnerPK,
  //     lamports, // Withdraw the full balance at the time of the transaction
  //   });
  //   try {
  //     const record = { message: 'account', data: { action: 'reStake' } }
  //     return this._txi.sendTx([withdrawTx], walletOwnerPK, null, record)

  //   } catch (error) {
  //     console.error(error)
  //   }
  // }

}
