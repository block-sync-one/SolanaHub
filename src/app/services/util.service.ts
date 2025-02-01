import { CurrencyPipe, DecimalPipe, DatePipe, PercentPipe } from "@angular/common";
import { Injectable, signal } from "@angular/core";
import { BehaviorSubject, filter, Observable, Subject } from "rxjs";
import { VirtualStorageService } from "./virtual-storage.service";
import { PublicKey } from "@solana/web3.js";
import { JupToken } from "../models/jup-token.model";

import { environment } from 'src/environments/environment';

declare global {

  interface Number {
    toFixedNoRounding: Function;
  }
}
Number.prototype.toFixedNoRounding = function (n) {
  const reg = new RegExp("^-?\\d+(?:\\.\\d{0," + n + "})?", "g")
  const a = this.toString().match(reg)[0];
  const dot = a.indexOf(".");
  if (dot === -1) { // integer, insert decimal dot and pad up zeros
    return a + "." + "0".repeat(n);
  }
  const b = n - (a.length - dot) + 1;
  return b > 0 ? (a + "0".repeat(b)) : a;
}




@Injectable({
  providedIn: "root",
})
export class UtilService {
  public currencyPipe: CurrencyPipe = new CurrencyPipe('en-US');
  public decimalPipe: DecimalPipe = new DecimalPipe('en-US');
  public percentPipe: PercentPipe = new PercentPipe('en-US');
  public datePipe: DatePipe = new DatePipe('en-US');
  constructor(

    private _vrs: VirtualStorageService
  ) {
  }
  public serverlessAPI = environment.apiUrl;



  public get RPC(): string {
    const config = JSON.parse(this._vrs.localStorage.getData('RPC'))?.value || environment.solanaCluster
    return config;
  }

  public get explorer(): string {
    const config = JSON.parse(this._vrs.localStorage.getData('explorer'))?.value || 'https://solscan.io'
    return config;
  }

  public get theme() {
    const config = JSON.parse(this._vrs.localStorage.getData('theme'))?.value || 'light'

    return config;
  }

  public formatBigNumbers = (n: number, decimals = 2) => {
    if (n < 1e3) return n.toFixedNoRounding(decimals);
    if (n >= 1e3 && n < 1e6) return Math.floor(n / 1e3 * 10) / 10 + "K";
    if (n >= 1e6 && n < 1e9) return Math.floor(n / 1e6 * 10) / 10 + "M";
    if (n >= 1e9 && n < 1e12) return Math.floor(n / 1e9 * 10) / 10 + "B";
    if (n >= 1e12) return Math.floor(n / 1e12 * 10) / 10 + "T";
    return n;
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


  private jupTokens: JupToken[] = null

  public async getJupTokens(path = 'all'): Promise<JupToken[]> {
    //const env = TOKEN_LIST_URL[environment.solanaEnv]//environment.solanaEnv
    if (!path && this.jupTokens) {
      return this.jupTokens
    } else {
      try {
        this.jupTokens = await (await fetch(`https://token.jup.ag/${path}`)).json();
        this.jupTokens.forEach(t => t.logoURI = t.logoURI ? t.logoURI : 'assets/images/unknown.svg');
      } catch (error) {
        console.error(error);
      }
    }
    return this.jupTokens
  }
  public addTokenData(assets: any, tokensInfo: JupToken[], mapBy: string = 'address'): any[] {

    return assets.map((res: any) => {

      // const { symbol, name, logoURI, decimals } = tokensInfo.find(token => token.address === res.data.address)

      // res?.data?.address === "11111111111111111111111111111111" ? res.data.address = "So11111111111111111111111111111111111111112" : res.data.address

      const token = tokensInfo.find(token => token.address === res?.data[mapBy])


      res?.data?.address === "11111111111111111111111111111111" ? res.data.address = "So11111111111111111111111111111111111111112" : res?.data?.address
      res.mint = token?.mint ? token.mint : '';
      res.name = token?.name ? token.name : 'unknown';
      res.name === 'Wrapped SOL' ? res.name = 'Solana' : res.name
      res.symbol = token?.symbol ? token.symbol : 'unknown';
      res.logoURI = token?.logoURI ? token.logoURI : 'assets/images/unknown.svg';
      res.decimals = token?.decimals ? token.decimals : '';;
      res.balance = res.data?.amount ? res.data?.amount : 0
      return res
    }).map((item: any) => {
      Object.assign(item, item.data)
      delete item.amount
      delete item.data;

      return item
    }).filter((item: any) => item.value > 0.01)
  }

  async getTokenInfo2(mintAddress: string) {
    try {
      const tokenInfo = await (await fetch(`${this.serverlessAPI}/api/portfolio/get-token-info?mintAddress=${mintAddress}`)).json()
      return tokenInfo
    } catch (error) {
      console.error(error);
      return null
    }
  }


  public memorySizeOf(obj) {
    var bytes = 0;

    function sizeOf(obj) {
      if (obj !== null && obj !== undefined) {
        switch (typeof obj) {
          case 'number':
            bytes += 8;
            break;
          case 'string':
            bytes += obj.length * 2;
            break;
          case 'boolean':
            bytes += 4;
            break;
          case 'object':
            var objClass = Object.prototype.toString.call(obj).slice(8, -1);
            if (objClass === 'Object' || objClass === 'Array') {
              for (var key in obj) {
                if (!obj.hasOwnProperty(key)) continue;
                sizeOf(obj[key]);
              }
            } else bytes += obj.toString().length * 2;
            break;
        }
      }
      return bytes;
    };

    function formatByteSize(bytes) {
      // if(bytes < 1024) return bytes + " bytes";
      // else if(bytes < 1048576) return(bytes / 1024).toFixed(3) + " KiB";
      // else if(bytes < 1073741824) return(bytes / 1048576).toFixed(3) + " MiB";
      // else return(bytes / 1073741824).toFixed(3) + " GiB";
      return bytes
    };

    return formatByteSize(sizeOf(obj));
  };

  public fixedNumber(value: any): string {
    // Convert the input to a number
    const num = Number(value);

    // If the number is not valid, return '0.00'
    if (isNaN(num) || !isFinite(num)) {
      return '0.00';
    }

    // Find the closest positive number
    const absNum = Math.abs(num);

    // Find the minimum number of decimal places needed
    let decimalPlaces = 2; // Start with minimum 2 decimal places
    let tempNum = absNum;
    while (tempNum < 0.01 && tempNum > 0) {
      tempNum *= 10;
      decimalPlaces++;
    }

    // Cap the decimal places at 8 to avoid excessive precision
    decimalPlaces = Math.min(decimalPlaces, 8);

    // Format the number with the calculated decimal places
    const formattedNum = absNum.toFixedNoRounding(decimalPlaces);

    // Remove trailing zeros after the decimal point, but keep at least 2 decimal places
    const trimmedNum = parseFloat(formattedNum).toFixedNoRounding(Math.max(2, (formattedNum.split('.')[1] || '').replace(/0+$/, '').length));

    // Localize the number
    return Number(trimmedNum).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });
  }
  public formatScientificToDecimal(num: any): string {
    // Convert to string and check if it's in scientific notation
    const numStr = num.toString();
    if (numStr.includes('e')) {
      // Convert scientific notation to decimal
      const res = Number(num).toFixed(20).replace(/\.?0+$/, '');
      return res
    }
    return numStr;
  }
}
