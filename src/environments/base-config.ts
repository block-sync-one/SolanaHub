import { BaseConfig } from "../app/models";

export const getBaseConfig = (): BaseConfig => {
  return {
    platformFeeCollector:'B4puwNbu1fARV4pdcDonreDTXec5JNAiG7MhiVjVRCtx', // hubsol reserve pool
    rpcs: [
      {
        name: 'Helius',
        imageURL: '../assets/images/helius-icon.png',
        value: 'https://carole-l8ne8x-fast-mainnet.helius-rpc.com'
      },
      
      {
        name: 'Triton',
        imageURL: '../assets/images/triton-icon.svg',
        value: 'https://mb-avaulto-cc28.mainnet.rpcpool.com'
      },
      {
        name: 'Custom RPC',
        imageURL: '../assets/images/cog-icon.svg',
        value: ''
      }
    ],
    explorers: [
      {
        name: 'Solscan',
        imageURL: '../assets/images/solscan-icon.svg',
        value: 'https://solscan.io'
      },
      {
        name: 'Solana FM',
        imageURL: '../assets/images/solanafm-icon.svg',
        value: 'https://solana.fm'
      },
      {
        name: 'SOL explorer',
        imageURL: '../assets/images/base-explorer-icon.svg',
        value: 'https://explorer.solana.com'
      }
    ],

    Theme: [
      {
        name: 'Light',
        imageURL: '../assets/images/sun-icon.svg',
        icon: 'sunny-outline',
        value: 'light'
      },
      {
        name: 'Dark',
        imageURL: '../assets/images/moon-icon.svg',
        icon: 'moon-outline',
        value: 'dark'
      }
    ]
  }
  
}
