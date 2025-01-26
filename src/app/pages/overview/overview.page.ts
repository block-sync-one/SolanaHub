import { Component, OnInit, computed, inject, Signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { toSignal } from '@angular/core/rxjs-interop';
import { AssetsTableComponent } from './assets-table/assets-table.component';
import { PortfolioMenuComponent } from './portfolio-menu/portfolio-menu.component';
import { PortfolioBreakdownComponent, TransactionsHistoryTableComponent } from "@app/shared/components";
import { PortfolioBreakdownService, PortfolioService, WatchModeService } from "@app/services";


@Component({
  selector: 'app-overview',
  templateUrl: './overview.page.html',
  styleUrls: ['./overview.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    PortfolioBreakdownComponent,
    AssetsTableComponent,
    PortfolioMenuComponent,
    TransactionsHistoryTableComponent,
  ]
})
export class OverviewPage implements OnInit {
  private readonly _portfolioBreakDownService = inject(PortfolioBreakdownService)
  private readonly _portfolioService = inject(PortfolioService)
  private readonly _watchModeService = inject(WatchModeService)
  public readonly allWalletsAssets = this._portfolioBreakDownService.getEnabledWalletsAssets;
  public readonly portfolioTotalUsdValue =  this._portfolioBreakDownService.portfolioTotalUsdValue;
  public readonly watchMode = toSignal(this._watchModeService.watchMode$)

  /**
   * Computed property that returns a Map of total USD values for all wallets.
   *
   * This computed property iterates through all portfolios in the _portfolioService,
   * calculates the total USD value for each wallet, and stores these totals in a Map.
   * The Map keys are wallet addresses, and the values are the corresponding total USD amounts.
   *
   * @type {Map<string, number>}
   * @readonly
   */
  public walletTotals: Signal<Map<string, number>> = computed(() => {
    const portfolioList = this._portfolioService.portfolio();
    const totals = new Map<string, number>();

    portfolioList.forEach((p) => {
      const { walletAddress, portfolio } = p;
      const total = portfolio.walletAssets
        ?.filter(data => (data?.value))
        .reduce((acc, curr) => acc + curr.value, 0) || 0;
      totals.set(walletAddress, total);
    });

    return totals;
  })

  async ngOnInit() {
    // this._shs.walletExtended$.pipe(this._utilService.isNotNullOrUndefined).subscribe(wallet =>{

    //    this._portfolioService.getWalletHistory(wallet.publicKey.toBase58())
    // })

  }
  // public walletHistory: WritableSignal<TransactionHistory[]> = this._portfolioService.walletHistory
}
