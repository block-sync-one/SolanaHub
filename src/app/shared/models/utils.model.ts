import {JupRoute, SwapToken} from "@app/models";

export interface JupSwapTxData {
  route: JupRoute;
  outputToken: SwapToken;
}
