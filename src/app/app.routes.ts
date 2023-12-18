import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
  // {
  //   path: 'folder/:id',
  //   loadComponent: () =>
  //     import('./folder/folder.page').then((m) => m.FolderPage),
  // },
  {
    path: 'overview',
    loadComponent: () => import('./pages/overview/overview.page').then( m => m.OverviewPage)
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then( m => m.SettingsPage)
  },
  {
    path: 'nft-gallery',
    loadComponent: () => import('./pages/nft-gallery/nft-gallery.page').then( m => m.NftGalleryPage)
  },
  {
    path: 'loyalty-league',
    loadComponent: () => import('./pages/loyalty-league/loyalty-league.page').then( m => m.LoyaltyLeaguePage)
  },
  {
    path: 'swap',
    loadComponent: () => import('./pages/swap/swap.page').then( m => m.SwapPage)
  },
  {
    path: 'staking',
    loadComponent: () => import('./pages/staking/staking.page').then( m => m.StakingPage)
  },
  {
    path: 'lending',
    loadComponent: () => import('./pages/lending/lending.page').then( m => m.LendingPage)
  },
  {
    path: 'liquidity-pools',
    loadComponent: () => import('./pages/liquidity-pools/liquidity-pools.page').then( m => m.LiquidityPoolsPage)
  },
  {
    path: 'vaults',
    loadComponent: () => import('./pages/vaults/vaults.page').then( m => m.VaultsPage)
  },



];