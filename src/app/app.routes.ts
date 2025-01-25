import { Routes } from '@angular/router';
import {RoutingPath} from "./shared/constants";

import { NotConnectedComponent } from './shared/layouts/not-connected/not-connected.component';
import { isConnectedGuard } from './shared/guards/is-connected.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: RoutingPath.OVERVIEW
    
  },
  {
    path: RoutingPath.OVERVIEW,
    loadComponent: () => import('./pages/overview/overview.page').then( m => m.OverviewPage),
    canActivate: []
  },
  {
    path: RoutingPath.STASH,
    loadComponent: () => import('./pages/stash/stash.page').then( m => m.StashPage),
    canActivate: []
  },
  {
    path: RoutingPath.COLLECTIBLES,
    loadComponent: () => import('./pages/collectibles/collectibles.page').then( m => m.CollectiblesPage),
    canActivate: []
  },
  {
    path: RoutingPath.BRIDGE,
    loadComponent: () => import('./pages/bridge/bridge.page').then( m => m.BridgePage), 
    canActivate: []
  },
  {
    path: RoutingPath.LOYALTY_LEAGUE,
    loadComponent: () => import('./pages/loyalty-league/loyalty-league.page').then( m => m.LoyaltyLeaguePage),
    canActivate: []
  },
  {
    path: `${RoutingPath.SWAP}/:pair`,
    loadComponent: () => import('./pages/swap/swap.page').then( m => m.SwapPage),
    canActivate: []
  },
  {
    path: RoutingPath.SWAP,
    loadComponent: () => import('./pages/swap/swap.page').then( m => m.SwapPage),
    canActivate: []
  },
  {
    path: RoutingPath.STAKING,
    loadComponent: () => import('./pages/staking/staking.page').then( m => m.StakingPage),
    canActivate: []
  },
  {
    path: RoutingPath.DAO,
    loadComponent: () => import('./pages/dao/dao.page').then( m => m.DaoPage),
    canActivate: []
  },
  {
    path: RoutingPath.AIRDROP_FINDER,
    loadComponent: () => import('./pages/airdrop-finder/airdrop-finder.page').then( m => m.AirdropFinderPage),
    canActivate: []
  },
  {
    path: RoutingPath.NOTIFICATIONS,
    loadComponent: () => import('./pages/notifications/notifications.page').then( m => m.NotificationsPage),
    canActivate: []
  },
  {
    path: RoutingPath.HUBSOL,
    loadComponent: () => import('./pages/hubsol/hubsol.page').then( m => m.HubsolPage)
  },
  {
    path:"**",
    redirectTo: RoutingPath.OVERVIEW
  },
];
