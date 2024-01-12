import { Injectable } from '@angular/core';
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
  StakeActivationData,
  StakeProgram,
  Transaction,

} from '@solana/web3.js';
import { SolanaHelpersService } from './solana-helpers.service';
import { TxInterceptorService } from './tx-interceptor.service';
import { StakeAccount, Validator, WalletExtended } from '../models';
import { UtilService } from './util.service';

@Injectable({
  providedIn: 'root'
})
export class NativeStakeService {

  constructor(
    private _utils: UtilService,
    private _txi: TxInterceptorService,
    private _shs: SolanaHelpersService
  ) { }



  private async _extendStakeAccount(
    account: { pubkey: PublicKey; account: AccountInfo<Buffer | ParsedAccountData | any> },
    validators: Validator[],
    // inflationReward: InflationReward
    ): Promise<StakeAccount>  {
    const pk = account.pubkey;
    const addr = pk.toBase58()
    const parsedData = account.account.data.parsed.info || null//.delegation.stake
    const validatorVoteKey = parsedData.stake?.delegation?.voter
    const stake = Number(parsedData.stake?.delegation?.stake) || 0;
    const startEpoch = parsedData.stake.delegation.activationEpoch;
    const rentReserve = Number(account.account.data.parsed.info.meta.rentExemptReserve);
    const accountLamport = Number(account.account.lamports);
    const excessLamport = accountLamport - stake - rentReserve
    const { active, state }: StakeActivationData = await this._shs.connection.getStakeActivation(pk);
    const validator = validators.find(v => v.vote_identity === validatorVoteKey)

    const stakeAccountInfo = {
      lockedDue: new Date(account.account.data.parsed.info.meta.lockup.unixTimestamp * 1000).toLocaleDateString("en-US"),
      locked: account.account.data.parsed.info.meta.lockup.unixTimestamp > Math.floor(Date.now() / 1000) ? true : false,
      addr,
      shortAddr: this._utils.addrUtil(addr).addrShort,
      balance: Number((stake / LAMPORTS_PER_SOL)),
      lamportsBalance: stake + rentReserve,
      state,
      validator,
      excessLamport,
      startEpoch,
      // lastReward: inflationReward?.amount / LAMPORTS_PER_SOL || 0,
      stakeAuth: parsedData.meta.authorized.staker,
      withdrawAuth: parsedData.meta.authorized.withdrawer,
    }


    return stakeAccountInfo
  }





  // public  async getInflationReward(accounts){
  //   const infRewards = accounts.map(async (acc,i) => {
  //     const startEpoch =  acc.account.data.parsed.info.stake.delegation.activationEpoch || null//.delegation.stake
  //     console.log(startEpoch,acc.pubkey);
      
  //     const res = await this._shs.connection.getInflationReward([acc.pubkey]) || null;
  //     console.log(res);
      
  //   })
  //   // const extendStakeAccountRes = await Promise.all(infRewards);
  //   // console.log(extendStakeAccountRes);
    
  //   try {
  //     // console.log(infRewards);
      
  //   } catch (error) {
      
  //   }
  //   // return stakeAccounts
  // }
  public async getOwnerNativeStake(walletAddress: string): Promise<StakeAccount[]> {
    // try {
      const validators: Validator[] = await this._shs.getValidatorsList()
      const stakeAccounts = await this._shs.getStakeAccountsByOwner(walletAddress);
      // const stakeAccountsPk = stakeAccounts.map(acc => acc.pubkey)
      // const infReward = await this._shs.connection.getInflationReward(stakeAccountsPk,);
      // const infReward = await this.getInflationReward(stakeAccounts);

      // console.log(amount);
      const extendStakeAccount = stakeAccounts.map(async (acc,i) => {
        return await this._extendStakeAccount(acc, validators)
      })
      const extendStakeAccountRes = await Promise.all(extendStakeAccount);
      // this.getInflationReward(extendStakeAccountRes)
      
      // this._stakeAccounts$.next(extendStakeAccountRes);
      return extendStakeAccountRes
    // } catch (error) {
    //   console.log(error);
    // }
    return null
  }

  public async deactivateStakeAccount(stakeAccountAddress: string, walletOwner: WalletExtended): Promise<string> {
    try {
      const deactivateTx: Transaction = StakeProgram.deactivate({
        stakePubkey: new PublicKey(stakeAccountAddress),
        authorizedPubkey: walletOwner.publicKey,
      });
      return await this._txi.sendTx([deactivateTx], walletOwner.publicKey)

    } catch (error) {
      console.log(error);

    }
    return null
  }

  public async transferStakeAccountAuth(
    stakePubkey: PublicKey,
    walletOwnerPk: PublicKey,
    newAuthorizedPubkey: PublicKey,
    authToTransfer: { stake: boolean, withdraw: boolean },
    record?
  ) {
    try {
      const transferAuthTx = [];
      if (authToTransfer.stake){
        const authWithdraw: AuthorizeStakeParams = {
          stakePubkey,
          authorizedPubkey: walletOwnerPk,
          newAuthorizedPubkey,
          stakeAuthorizationType: { index: 0 },
        }
        transferAuthTx.push(StakeProgram.authorize(authWithdraw))
      }
      if(authToTransfer.withdraw){
        const authStake: AuthorizeStakeParams = {
          stakePubkey,
          authorizedPubkey: walletOwnerPk,
          newAuthorizedPubkey,
          stakeAuthorizationType: { index: 1 },
        }
        transferAuthTx.push(StakeProgram.authorize(authStake))
      }

      console.log("instructions:", authToTransfer, "should transfer: ",transferAuthTx);
      
      return await this._txi.sendTx(transferAuthTx, walletOwnerPk, null, record)
    } catch (error) {
      console.log(error);
    }
    return null
  }

  public async splitStakeAccounts(walletOwnerPk: PublicKey, targetStakePubKey: PublicKey, newStakeAccount: Keypair, lamports: number, record?) {
    try {

      // const newStakeAccount = (await this.createStakeAccount(0,walletOwnerPk)).newStakeAccount
      // const stakeAccountData = await this.createStakeAccount(0, walletOwnerPk)
      // const newStakeAcc: Keypair = stakeAccountData.newStakeAccount;
      // const newStakeAccount = new Keypair();
      const splitAccount: Transaction =
        StakeProgram.split({
          stakePubkey: targetStakePubKey,
          authorizedPubkey: walletOwnerPk,
          splitStakePubkey: newStakeAccount.publicKey,
          lamports
        });


      return await this._txi.sendTx([splitAccount], walletOwnerPk, [newStakeAccount], record)
    } catch (error) {
      console.log(error);
    }
    return null
  }
  public async mergeStakeAccounts(walletOwnerPk: PublicKey, targetStakePubkey: PublicKey, sourceStakePubKey: PublicKey[], record?) {

    try {
      const mergeAccounts: Transaction[] = sourceStakePubKey.map(sourceAcc => {
        return StakeProgram.merge({
          authorizedPubkey: walletOwnerPk,
          sourceStakePubKey: sourceAcc,
          stakePubkey: targetStakePubkey,
        });
      })

      return await this._txi.sendTx(mergeAccounts, walletOwnerPk, null, record)
    } catch (error) {
      console.log(error);
    }
    return null

  }

  public async withdraw(stakeAccount: StakeAccount, walletOwner: WalletExtended): Promise<any> {
    console.log(stakeAccount);

    const withdrawTx = StakeProgram.withdraw({
      stakePubkey: new PublicKey(stakeAccount.addr),
      authorizedPubkey: walletOwner.publicKey,
      toPubkey: walletOwner.publicKey,
      lamports: stakeAccount.lamportsBalance, // Withdraw the full balance at the time of the transaction
    });
    try {
      //   const validTx = await this.prepTx(lamports, withdrawTx, walletOwnerPk)
      //   if (validTx) {
      return await this._txi.sendTx([withdrawTx], walletOwner.publicKey)
      // }
    } catch (error) {
      console.error(error)
    }
  }
  private _createStakeAccount(lamportToSend: number, walletOwner: WalletExtended, lockupDuration: number = 0) {

    const fromPubkey = walletOwner.publicKey;
    const newStakeAccount = new Keypair();
    const authorizedPubkey = walletOwner.publicKey;
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
    walletOwner: WalletExtended,
    validatorVoteKey: string,
    lockupDuration: number = 0
  ): Promise<string> {
    const minimumAmount = await this._shs.connection.getMinimumBalanceForRentExemption(
      StakeProgram.space,
    );
    if (lamportsToDelegate < minimumAmount) {
      return null;
      // return this._formatErrors({ message: `minimum size for stake account creation is: ${minimumAmount / LAMPORTS_PER_SOL} sol` })
    }

    try {
      const stakeAccountData = this._createStakeAccount(lamportsToDelegate, walletOwner, lockupDuration)
      const stakeAcc: Keypair = stakeAccountData.newStakeAccount;
      const stakeAccIns: Transaction = stakeAccountData.newStakeAccountIns;
      const delegateTX: Transaction = this._delegateStakeAccount(stakeAcc.publicKey.toBase58(), validatorVoteKey, walletOwner)

      const stakeIx: Transaction[] = [stakeAccIns, delegateTX]
      const record = { message: `native stake`, data: { validator: validatorVoteKey, amount: Number(lamportsToDelegate.toString()) * LAMPORTS_PER_SOL } }
      return this._txi.sendTx(stakeIx, walletOwner.publicKey, [stakeAcc], record)

    } catch (error) {
      console.warn(error)
    }
    return null
  }
  public reStake(stakeAccount: StakeAccount, walletOwner: WalletExtended) {
    try {
      const delegateTX: Transaction = this._delegateStakeAccount(stakeAccount.addr, stakeAccount.validator.vote_identity, walletOwner)
      const record = { message: `native reStake` }

      return this._txi.sendTx([delegateTX], walletOwner.publicKey, null, record)

    } catch (error) {
      console.log(error);
    }
    return null
  }
  private _delegateStakeAccount(stakeAccountAddress: string, validatorVoteKey: string, walletOwner: WalletExtended): Transaction {
    try {
      const instruction: DelegateStakeParams = {
        stakePubkey: new PublicKey(stakeAccountAddress),
        authorizedPubkey: walletOwner.publicKey,
        votePubkey: new PublicKey(validatorVoteKey)
      }
      const delegateTX: Transaction = StakeProgram.delegate(instruction);
      return delegateTX;

    } catch (error) {
      console.error(error);
    }
    return null
  }


  // instant unstake by sanctum
  public async initSanctum() {

    // This loads the required accounts for all stake pools
    // and jup-ag from on-chain.
    // The arg type is `JupiterLoadParams` from jup-ag
    // const unstake = await UnstakeAg.load({
    //   cluster: "mainnet-beta",
    //   connection:this._shs.connection,
    //   // if you're using only legacy transactions (no lookup tables),
    //   // you should set ammsToExclude to legacyTxAmmsToExclude() to
    //   // avoid running into transaction size limits
    //   ammsToExclude: legacyTxAmmsToExclude(),
    // });
  }
}