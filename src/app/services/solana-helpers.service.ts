import { Injectable, inject, signal } from '@angular/core';
import { ConnectionStore, WalletStore, connectionConfigProviderFactory } from '@heavy-duty/wallet-adapter';
import { AccountInfo, Connection, GetProgramAccountsFilter, LAMPORTS_PER_SOL, ParsedAccountData, PublicKey, TokenBalance, TransactionInstruction } from '@solana/web3.js';

import {
  TOKEN_PROGRAM_ID,
  createTransferCheckedInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  TokenOwnerOffCurveError,
} from 'node_modules/@solana/spl-token';

import { BehaviorSubject, Observable, firstValueFrom, map, shareReplay, switchMap } from 'rxjs';
import { Validator, WalletExtended, StakeWizEpochInfo, StakeAccountShyft, Token } from '../models';
import { ApiService } from './api.service';
import { UtilService } from './util.service';
import { WatchModeService } from './watch-mode.service';
;
@Injectable({
  providedIn: 'root'
})
export class SolanaHelpersService {
  public wallet = signal<WalletExtended | null>(null);
  readonly restAPI = this._utils.serverlessAPI
  readonly SolanaHubVoteKey: string = '7K8DVxtNJGnMtUY1CQJT5jcs8sFGSZTDiG7kowvFpECh';
  public connection: Connection;
  // create a single source of trute for wallet adapter
  private _walletExtended$: BehaviorSubject<Partial<WalletExtended> | WalletExtended> = new BehaviorSubject(null);
  // add balance utility
  public walletExtended$ = this._walletExtended$.asObservable().pipe(
    switchMap(async (wallet: any) => {
      if (wallet) {
        wallet.signMessage = async (message) => await firstValueFrom(this._walletStore.signMessage(message))
        wallet.balance = (await this.connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL
      }
      return wallet;
    }),
    shareReplay(1),
  )

  constructor(
    private _apiService: ApiService,
    private _connectionStore: ConnectionStore,
    private _walletStore: WalletStore,
    private _utils: UtilService,
    private _watchModeService: WatchModeService,
  ) {
    // prep setup
    this.getValidatorsList()

    const rpc = this._utils.RPC
    this._connectionStore.setEndpoint(rpc)
    this._connectionStore.connection$.subscribe(conection => this.connection = conection);
    this._walletStore.anchorWallet$.subscribe(wallet => this._walletExtended$.next(wallet));
    this._watchModeService.watchedWallet$.subscribe(wallet => this._walletExtended$.next(wallet));
  }
  public updateRPC(rpcURL) {
    this._connectionStore.setEndpoint(rpcURL)
  }
  public getCurrentWallet(): WalletExtended | Partial<WalletExtended> {
    this.wallet.set(this._walletExtended$.value as WalletExtended)
    return this._walletExtended$.value
  }


  private _validatorsList: Validator[] =  []
  
  public async getValidatorsList(): Promise<Validator[]> {
    if (this._validatorsList.length > 0) {


      return this._validatorsList;
    } else {

      let validatorsList: Validator[] = [];
      try {
        const result = await (await fetch('https://api.stakewiz.com/validators')).json();

        validatorsList = result
      } catch (error) {
        console.error(error);
      }
      this._validatorsList = validatorsList;
      return validatorsList
    }
  }

  public getAvgApy() {
    return this._apiService.get(`https://api.stakewiz.com/cluster_stats`).pipe(
      map((clusterInfo) => {
        const { avg_apy } = clusterInfo;

        return avg_apy
      }),
      // catchError(this._formatErrors)
    );
  }


  public async getStakeAccountsByOwner2(walletAddress: string): Promise<StakeAccountShyft[]> {
    try {
      return await (await fetch(`${this.restAPI}/api/portfolio/nativeStakeAccounts?address=${walletAddress}`)).json()
    } catch (error) {
      console.error(error);

      return []
    }
  }

  // public async getStakeAccountsByOwner(walletAddress: string): Promise<Array<{
  //   pubkey: PublicKey;
  //   account: AccountInfo<Buffer | ParsedAccountData | any>;
  // }>> {
  //   try {

  //     // get stake account
  //     const stakeAccounts: Array<{
  //       pubkey: PublicKey;
  //       account: AccountInfo<Buffer | ParsedAccountData | any>;
  //     }> = await this.connection.getParsedProgramAccounts(new PublicKey("Stake11111111111111111111111111111111111111"), {

  //       "filters": [   {
  //         "memcmp": {
  //           "offset": 12, // fetch stake auth controlled by wallets
  //           "bytes": walletAddress,
  //         }
  //       },
  //         {
  //           "memcmp": {
  //             "offset": 44, // fetch stake auth controlled by program
  //             "bytes": walletAddress,
  //           }
  //         }
  //       ]
  //     })

  //     console.log(stakeAccounts);

  //     return stakeAccounts;
  //   } catch (error) {
  //     new Error(error)
  //   }
  //   return [];
  // }


  public async getClusterStake(): Promise<{ activeStake, delinquentStake }> {
    const stakeInfo = await this.connection.getVoteAccounts()
    const activeStake = stakeInfo.current.reduce(
      (previousValue, currentValue) => previousValue + currentValue.activatedStake,
      0
    ) / LAMPORTS_PER_SOL
    const delinquentStake = stakeInfo.delinquent.reduce(
      (previousValue, currentValue) => previousValue + currentValue.activatedStake,
      0
    ) / LAMPORTS_PER_SOL
    return { activeStake, delinquentStake }
  }

  public getEpochInfo(): Observable<StakeWizEpochInfo> {
    return this._apiService.get(`https://api.stakewiz.com/epoch_info`).pipe(
      map((data: StakeWizEpochInfo) => {
        const { remaining_seconds, elapsed_seconds, duration_seconds } = data
        const days = Math.floor(remaining_seconds / 86400);
        const hours = Math.floor(remaining_seconds / 3600) - (days * 24);
        const minutes = Math.floor(remaining_seconds / 60) - (days * 1440) - (hours * 60);
        data.ETA = `ETA ${days}d ${hours}h ${minutes}m`
        data.timepassInPercentgae = elapsed_seconds / duration_seconds
        return data
      }),
      // catchError(this._formatErrors)
    );
  }

  public async getTokenAccountsBalance(wallet: string, includeMeta: boolean, emptyAccountOnly: boolean, getType?: 'token' | 'nft'): Promise<any[]> {
    const filters: GetProgramAccountsFilter[] = [
      {
        dataSize: 165,    //size of account (bytes)
      },
      {
        memcmp: {
          offset: 32,     //location of our query in the account (bytes)
          bytes: wallet,  //our search criteria, a base58 encoded string
        }
      }
    ];
    const accounts = await this.connection.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID,   //SPL Token Program, new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
      { filters }
    );

    let tokensBalance = accounts.map((account, i) => {
      //Parse the account data
      const parsedAccountInfo: any = account.account.data;
      const mint: string = parsedAccountInfo["parsed"]["info"]["mint"];
      const balance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
      const decimals: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["decimals"];
      return { data: { address: account.pubkey.toString(), mint, balance, decimals } } as any
    })
    if (getType) {
      if (getType == 'nft') {
        tokensBalance = tokensBalance.filter(token => token.data.decimals == 0)
      } else if (getType == 'token') {
        tokensBalance = tokensBalance.filter(token => token.data.decimals != 0)
      }
    }
    if (includeMeta) {
      const jupTokens = await this._utils.getJupTokens()
      const mapBy = 'mint';

      tokensBalance = this._utils.addTokenData(tokensBalance, jupTokens, mapBy) as Token[]
    }
    if (emptyAccountOnly) {
      tokensBalance = tokensBalance.filter((acc: any) => acc.balance === 0)
    }

    return tokensBalance;

  }

  // try {
  //   const mintPubkey = new PublicKey(mintAddressPK);
  //   // const ownerAta = await this.getOrCreateTokenAccountInstruction(mintAddressPK, walletOwner, walletOwner);
  //   const account = await getAssociatedTokenAddress(mintPubkey, walletOwner);
  //   const decimals = await this.connection.getParsedAccountInfo(mintPubkey);

  //   console.log(account, decimals);

  //   let txIns: TransactionInstruction = createBurnCheckedInstruction(
  //     account, // PublicKey of Owner's Associated Token Account
  //     mintPubkey, // Public Key of the Token Mint Address
  //     walletOwner, // Public Key of Owner's Wallet
  //     1, // amount, if your decimals is 8, 10^8 for 1 token
  //     1
  //   );
  //   console.log(txIns,account);

  //   return txIns;
  // } catch (error) {
  //   console.error(error);
  //   return null
  // }

  async getOrCreateTokenAccountInstruction(mint: PublicKey, user: PublicKey, payer: PublicKey | null = null): Promise<TransactionInstruction | null> {
    try {
      const userTokenAccountAddress = await getAssociatedTokenAddress(mint, user, false);
      const userTokenAccount = await this.connection.getParsedAccountInfo(userTokenAccountAddress);
      if (userTokenAccount.value === null) {
        return createAssociatedTokenAccountInstruction(payer ? payer : user, userTokenAccountAddress, user, mint);
      } else {
        return null;
      }
    } catch (error) {
      console.warn(error)
      return null
      // this._formatErrors()
    }
  }
  public async sendSplOrNft(mintAddressPK: PublicKey, walletOwner: PublicKey, toWallet: string, amount: number): Promise<TransactionInstruction[] | null> {
    try {
      const toWalletPK = new PublicKey(toWallet);
      const ownerAta = await this.getOrCreateTokenAccountInstruction(mintAddressPK, walletOwner, walletOwner);
      const targetAta = await this.getOrCreateTokenAccountInstruction(mintAddressPK, toWalletPK, walletOwner);
      const tokenAccountSourcePubkey = await getAssociatedTokenAddress(mintAddressPK, walletOwner);
      const tokenAccountTargetPubkey = await getAssociatedTokenAddress(mintAddressPK, toWalletPK);

      const decimals = await (await this.connection.getParsedAccountInfo(mintAddressPK))?.value?.data['parsed']?.info?.decimals || 0;
      console.log(decimals);

      const transferSplOrNft = createTransferCheckedInstruction(
        tokenAccountSourcePubkey,
        mintAddressPK,
        tokenAccountTargetPubkey,
        walletOwner,
        amount * Math.pow(10, decimals),
        decimals,
        [],
        TOKEN_PROGRAM_ID
      )
      const instructions: TransactionInstruction[] = [ownerAta, targetAta, transferSplOrNft].filter(i => i !== null) as TransactionInstruction[];
      return instructions
    } catch (error) {

      const res = new TokenOwnerOffCurveError()
      console.error(error, res)
      // this._formatErrors(error)
      return null
    }
  }
}
