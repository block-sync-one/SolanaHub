import { DecimalPipe} from "@angular/common";
import {  Injectable } from "@angular/core";
import { BehaviorSubject, filter, Observable } from "rxjs";
import { LocalStorageService } from "./local-storage.service";
import { PublicKey } from "@solana/web3.js";
// import { PriorityFee } from "../models/priorityFee.model";
// import { LocalStorageService } from "./local-storage.servic";
// import * as moment from "moment";
// import { v4 as uuidv4 } from "uuid";

export enum PriorityFee {
  None = "0",
  Fast = "1",
  Supercharger = "3",
}

@Injectable({
  providedIn: "root",
})
export class UtilService {
  constructor(
    private _decimalPipe: DecimalPipe,
    private localStore: LocalStorageService) {
  }
  public serverlessAPI = location.hostname === "localhost" ? 'http://localhost:3000' : 'https://api.SolanaHub.app'

  private _systemExplorer = new BehaviorSubject<string>(this.localStore.getData('explorer') || 'https://solana.fm' as string);
  public explorer$ = this._systemExplorer.asObservable();
  public changeExplorer(name: string): void {
    this.localStore.saveData('explorer', name);
    this._systemExplorer.next(name);
  }
  get explorer(): string {
    return this._systemExplorer.value;
  }
  private _PriorityFee = PriorityFee.None;
  public get priorityFee(): PriorityFee {
    return this._PriorityFee;
  }


  public set priorityFee(v: PriorityFee) {
    this._PriorityFee = v;
  }

  public formatBigNumbers = (n:number) => {
    if (n < 1e3) return this._decimalPipe.transform(n, '1.2-2');
    if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
    if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
    if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
    if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
    else return n;
  };


  public addrUtil = (addr: string): { addr: string, addrShort: string } => {
    //@ts-ignore
    return { addr, addrShort: addr?.substring(0, 4) + '...' + addr.substring(addr.length - 4, addr.length[addr.length]) }
  }

  public sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))

  public isNotNull = <T>(source: Observable<T | null>) => source.pipe(filter((item: T | null): item is T => item !== null));
  public isNotUndefined = <T>(source: Observable<T | null>) => source.pipe(filter((item: T | null): item is T => item !== undefined));
  public isNotNullOrUndefined = <T>(source: Observable<T | null>) => source.pipe(filter((item: T | null): item is T => item !== null && item !== undefined));
  public validateAddress = (address: string): boolean => {
   return PublicKey.isOnCurve(address);
  }
}
