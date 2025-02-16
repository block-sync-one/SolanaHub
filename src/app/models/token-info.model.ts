import {LiquidStakeToken} from "@app/models/stake.model";
import {JupRoute} from "@app/models/jup-token.model";

export interface TokenInfo {
  address: string;
  decimals: number;
  symbol: string;
  logoURI: string | string[];
}

export interface SwapToken extends TokenInfo {
  balance: number;
  name: string;
}

export interface ConvertToHubSolToken extends LiquidStakeToken {
  checked?: boolean,
  hubSolValue?: number
  route: JupRoute
}

export interface BestRoute {
  route: JupRoute,
  value: number
}
