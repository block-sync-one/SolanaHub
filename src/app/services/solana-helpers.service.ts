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
import { Validator, WalletExtended, StakeWizEpochInfo, Token } from '../models';
import { ApiService } from './api.service';
import { UtilService } from './util.service';
import { WatchModeService } from './watch-mode.service';
import { VirtualStorageService } from './virtual-storage.service';
;
@Injectable({
  providedIn: 'root'
})
export class SolanaHelpersService {
  public wallet = signal<WalletExtended | null>(null);
  readonly restAPI = this._utils.serverlessAPI

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
    private _vrs: VirtualStorageService
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


  private _validatorsList: Validator[] = []

  public async getValidatorsList(): Promise<Validator[]> {
    // Try to get cached data from localStorage
    const cachedData = await this._vrs.indexDB.getData('validatorsList', 'validatorsList');
    const cachedTimestamp = await this._vrs.indexDB.getData('validatorsListTimestamp', 'validatorsListTimestamp');
    const fetchAndUpdateValidators = async (): Promise<Validator[]> => {
      try {
        const result = await (await fetch('https://api.stakewiz.com/validators')).json();

        // Update localStorage with new data and timestamp
        this._vrs.indexDB.saveData('validatorsList', 'validatorsList', JSON.stringify(result));
        this._vrs.indexDB.saveData('validatorsListTimestamp', 'validatorsListTimestamp', Date.now().toString());

        this._validatorsList = result;
        return result;
      } catch (error) {
        console.error(error);
        return this._validatorsList;
      }
    }
    if (cachedData) {
      this._validatorsList = JSON.parse(cachedData as string);
      // Check if cache is older than 2 days
      const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
      const isStale = !cachedTimestamp || (Date.now() - Number(cachedTimestamp)) > TWO_DAYS_MS;

      // Return cached data immediately
      if (!isStale) {
        return this._validatorsList;
      }

      // If stale, fetch new data in background
      fetchAndUpdateValidators();
      return this._validatorsList;
    }

    // No cached data, fetch from API
    return fetchAndUpdateValidators();
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
        data.ETA = `${days}d ${hours}h ${minutes}m`
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


  // Main function to get the Unix timestamp of a specific epoch
  async getEpochTimestamp(epoch) {


    // Function to calculate the starting slot for a specific epoch
    const calculateStartingSlot = (epoch, firstNormalSlot, firstNormalEpoch, slotsPerEpoch) => {
      return firstNormalSlot + (epoch - firstNormalEpoch) * slotsPerEpoch;
    }

    const findValidSlot = async (startingSlot: number) => {
      let currentSlot = startingSlot;
      let attempts = 0;
      const maxAttempts = 50;
      const incrementBy = 1000;

      while (attempts < maxAttempts) {
        try {
          const blockTime = await this.connection.getBlockTime(currentSlot);
          if (blockTime !== null) {
            return { slot: currentSlot, blockTime };
          }
        } catch (error) {
          // Log error but continue the loop
          console.log(`Failed to get block time for slot ${currentSlot}: ${error.message}`);
          // If error contains information about first available block, use that
          if (error.message?.includes('First available block:')) {
            const match = error.message.match(/First available block: (\d+)/);
            if (match) {
              currentSlot = parseInt(match[1]);
              continue;
            }
          }
        }
        currentSlot += incrementBy;
        attempts++;
      }
      return null;
    }

    try {

      const { firstNormalSlot, firstNormalEpoch, slotsPerEpoch } = {
        slotsPerEpoch: 432000,
        firstNormalEpoch: 0,
        firstNormalSlot: 0
      };

      const startingSlot = await calculateStartingSlot(epoch, firstNormalSlot, firstNormalEpoch, slotsPerEpoch);
      console.log(`Starting Slot for Epoch ${epoch}: ${startingSlot}`);

      const { slot, blockTime } = await findValidSlot(startingSlot);
      console.log(`Unix Timestamp for Epoch ${epoch}: ${blockTime} (from slot ${slot})`);
      return blockTime * 1000
    } catch (error) {
      console.error("Error:", error.message);
      return null
    }
  }

}
