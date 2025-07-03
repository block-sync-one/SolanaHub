
export interface JupToken {
    chainId: number; // 101,
    address: string; // 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    mint?: string;
    symbol: string; // 'USDC',
    name: string; // 'Wrapped USDC',
    decimals: number; // 6,
    logoURI: string; // 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/BXXkv6z8ykpG1yuvUDPgh732wzVHB69RnB9YgSYh3itW/logo.png',
    tags?: string[]; // [ 'stablecoin' ]
    extraData?: {balance?: string}
    balance?: number;
  }

  export interface JupiterPriceFeed {
    data: {
        [x: string]: {
            id: string,
            mintSymbol: string,
            vsToken: string,
            vsTokenSymbol: string,
            usdPrice: number
        }
    },
    timeTaken: number,
    contextSlot: number
}

export interface JupRoute{
    inputMint:            string;
    inAmount:             string;
    outputMint:           string;
    outAmount:            string;
    otherAmountThreshold: string;
    swapMode:             string;
    slippageBps:          number;
    platformFee:          null;
    priceImpactPct:       string;
    routePlan:            RoutePlan[];
    contextSlot:          number;
    timeTaken:            number;
    outAmountCopy?:       string;
    otherAmountThresholdCopy?: string;
}

export interface RoutePlan {
    swapInfo: SwapInfo;
    percent:  number;
}

export interface SwapInfo {
    ammKey:     string;
    label:      string;
    inputMint:  string;
    outputMint: string;
    inAmount:   string;
    outAmount:  string;
    feeAmount:  string;
    feeMint:    string;
}

