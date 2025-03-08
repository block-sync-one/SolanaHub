// src/app/shared/constants/seo.config.ts

export interface SeoData {
    TITLE: string;
    DESCRIPTION: string;
    KEYWORDS: string;
    URL?: string;
    CANONICAL?: string;
    IMAGE?: string;
    IMAGE_ALT?: string;
    H1?: string;
    P?: string;
    SCHEMA?: Record<string, any>;
  }
  
  export const SEO: Record<string, SeoData> = {
    default: {
      TITLE: 'SolanaHub',
      DESCRIPTION: 'SolanaHub: The best place to handle all your everyday Solana tasks. Built for degens & maxis.',
      KEYWORDS: 'Solana portfolio, Solana watcher, solana staking, Solana defi, SolanaHub',
      URL: 'https://solanahub.app',
      CANONICAL: 'https://solanahub.app',
      IMAGE: 'https://shdw-drive.genesysgo.net/AHzrxKBP6fkj6sozaZ2uzv6nniJLRFnZNZQ6rEPfZM5E/banner.jpeg',
      IMAGE_ALT: 'SolanaHub Banner',
      H1: 'Welcome to SolanaHub',
      P: 'Manage all your Solana activities easily, from staking and NFTs to DeFi tracking and more.',
      SCHEMA: {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "SolanaHub",
        "url": "https://solanahub.app",
        "logo": "https://shdw-drive.genesysgo.net/AHzrxKBP6fkj6sozaZ2uzv6nniJLRFnZNZQ6rEPfZM5E/banner.jpeg",
        "description": "SolanaHub: The best place to handle all your everyday Solana tasks."
      }
    },
  
    overview: {
      TITLE: 'SolanaHub - Portfolio Overview',
      DESCRIPTION: 'Get a complete overview of your Solana portfolio. Track assets, monitor performance, and manage investments.',
      KEYWORDS: 'Solana overview, portfolio tracker, Solana dashboard, SolanaHub overview',
      URL: 'https://solanahub.app/overview',
      CANONICAL: 'https://solanahub.app/overview',
      IMAGE: 'https://shdw-drive.genesysgo.net/AHzrxKBP6fkj6sozaZ2uzv6nniJLRFnZNZQ6rEPfZM5E/banner.jpeg',
      IMAGE_ALT: 'Portfolio Overview',
      H1: 'Your Solana Portfolio Overview',
      P: 'Track and manage your Solana investments with detailed insights in a single dashboard.',
      SCHEMA: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "SolanaHub - Portfolio Overview",
        "description": "Complete portfolio tracking for Solana assets.",
        "url": "https://solanahub.app/overview"
      }
    },
  
    stash: {
      TITLE: 'SolanaHub - Stash',
      DESCRIPTION: 'Find hidden balances in your wallet and convert them to SOL quickly.',
      KEYWORDS: 'swap, close accounts, claim SOL, MEV harvest, hidden balances, stash, claim your SOL, sol incinerator, solana incinerator',
      URL: 'https://solanahub.app/stash',
      CANONICAL: 'https://solanahub.app/stash',
      IMAGE: 'https://shdw-drive.genesysgo.net/AHzrxKBP6fkj6sozaZ2uzv6nniJLRFnZNZQ6rEPfZM5E/banner.jpeg',
      IMAGE_ALT: 'Stash Hidden Balances',
      H1: 'Unlock Hidden Wallet Balances',
      P: 'Convert forgotten wallet balances into usable SOL quickly and effortlessly.',
      SCHEMA: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "SolanaHub - Stash",
        "description": "Find hidden balances in your wallet and convert them to SOL.",
        "url": "https://solanahub.app/stash"
      }
    },
  
    collectibles: {
      TITLE: 'SolanaHub - Collectibles',
      DESCRIPTION: 'Browse and manage your Solana NFT collectibles. View your entire collection in one convenient dashboard.',
      KEYWORDS: 'Solana NFT, Solana collectibles, Solana digital art, SolanaHub NFT',
      URL: 'https://solanahub.app/collectibles',
      CANONICAL: 'https://solanahub.app/collectibles',
      IMAGE: 'https://shdw-drive.genesysgo.net/AHzrxKBP6fkj6sozaZ2uzv6nniJLRFnZNZQ6rEPfZM5E/banner.jpeg',
      IMAGE_ALT: 'Solana NFT Collectibles',
      H1: 'Your Solana NFT Collectibles',
      P: 'Easily browse, organize, and manage your Solana NFTs in one intuitive dashboard.',
      SCHEMA: {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "SolanaHub - Collectibles",
        "description": "Browse and manage your Solana NFT collectibles.",
        "url": "https://solanahub.app/collectibles"
      }
    },
  
    staking: {
      TITLE: 'SolanaHub - Staking',
      DESCRIPTION: 'Stake your SOL securely and earn reliable rewards.',
      KEYWORDS: 'stake SOL, Solana staking, SOL staking, validator staking, MEV, native stake, liquid stake',
      URL: 'https://solanahub.app/staking',
      CANONICAL: 'https://solanahub.app/staking',
      IMAGE: 'https://shdw-drive.genesysgo.net/AHzrxKBP6fkj6sozaZ2uzv6nniJLRFnZNZQ6rEPfZM5E/banner.jpeg',
      IMAGE_ALT: 'Solana Staking',
      H1: 'Stake SOL, Earn Rewards',
      P: 'Easily stake your SOL and maximize your earnings with SolanaHub’s optimized staking tools.',
      SCHEMA: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "SolanaHub - Staking",
        "description": "Securely stake your SOL and earn rewards through SolanaHub.",
        "url": "https://solanahub.app/staking"
      }
    },
  
    dao: {
      TITLE: 'SolanaHub - DAO Governance',
      DESCRIPTION: 'Engage in Solana DAOs, vote on proposals, and participate in governance.',
      KEYWORDS: 'Solana DAO, governance, voting, proposals, decentralized autonomous organization',
      URL: 'https://solanahub.app/dao',
      CANONICAL: 'https://solanahub.app/dao',
      IMAGE: 'https://shdw-drive.genesysgo.net/AHzrxKBP6fkj6sozaZ2uzv6nniJLRFnZNZQ6rEPfZM5E/banner.jpeg',
      IMAGE_ALT: 'DAO Governance',
      H1: 'Participate in Solana Governance',
      P: 'Stay informed and active in Solana governance with a clear overview of all proposals.',
    },
  
    hubsol: {
      TITLE: 'SolanaHub - HUBSOL Token',
      DESCRIPTION: 'Discover HUBSOL, SolanaHub’s native token. Stake, earn, and unlock premium features.',
      KEYWORDS: 'HUBSOL token, SolanaHub token, staking rewards, HUBSOL pro access',
      URL: 'https://solanahub.app/hubsol',
      CANONICAL: 'https://solanahub.app/hubsol',
      IMAGE: 'https://shdw-drive.genesysgo.net/AHzrxKBP6fkj6sozaZ2uzv6nniJLRFnZNZQ6rEPfZM5E/banner.jpeg',
      IMAGE_ALT: 'HUBSOL Token',
      H1: 'Meet HUBSOL: Powering SolanaHub',
      P: 'Stake HUBSOL, earn attractive rewards, and unlock exclusive platform features.',
    }
  };
  