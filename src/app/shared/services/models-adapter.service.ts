import {Injectable} from "@angular/core";
import {SwapToken, TokenInfo} from "@app/models";

@Injectable({
  providedIn: 'root'
})
export class ModelsAdapterService {

  public mapToTokenInfo = (token: any): TokenInfo => {
    return {
      address: token.address,
      decimals: token.decimals,
      symbol: token.symbol,
      logoURI:  Array.isArray(token.logoURI) ? token.logoURI[0] : token.logoURI
    };
  }

  public mapToSwapInfo = (token: any): SwapToken => {
    return {
      ...this.mapToTokenInfo(token),
      name: token.name,
      balance: token.balance
    };
  }
}
