import { inject, Injectable, signal } from '@angular/core';
import { PublicKey } from '@solana/web3.js';
import { BehaviorSubject, Observable, Subject, map, switchMap } from 'rxjs';
import { WalletExtended } from '../models';
import { UtilService } from './util.service';


@Injectable({
  providedIn: 'root'
})
export class WatchModeService {
  private _utils = inject(UtilService)
  readonly _restAPI = this._utils.serverlessAPI
  public watchedWallet$: BehaviorSubject<Partial<WalletExtended>> = new BehaviorSubject(null as Partial<WalletExtended>);
  public watchMode$: Observable<boolean> = this.watchedWallet$.asObservable().pipe(map((address) => address ? true : false))
  public async convertNameServiceToWalletAddress(nameService: string){
    try {
      const walletAddress = await fetch(`${this._restAPI}/api/portfolio/get-owner?domain=${nameService}`).then(res => res.json())
      return walletAddress
    } catch (error) {
      return null
    }
  }
  public checkAndSetWatchMode(walletAddress: string){
    if (!!new PublicKey(walletAddress) || PublicKey.isOnCurve(walletAddress)) {
      const publicKey = new PublicKey(walletAddress)
      this.watchedWallet$.next({ publicKey })
    }
  }
}
