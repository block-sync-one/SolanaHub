import { Component, OnInit, computed, inject, Signal, DestroyRef } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AssetsTableComponent } from './assets-table/assets-table.component';
import { PortfolioMenuComponent } from './portfolio-menu/portfolio-menu.component';
import { PortfolioBreakdownComponent, TransactionsHistoryTableComponent } from "@app/shared/components";
import { ConvertPositionsService, PortfolioBreakdownService, PortfolioService, WatchModeService } from "@app/services";
import { ConvertPositionsModalComponent } from "@app/pages";
import va from "@vercel/analytics";

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
  private readonly _modalCtrl = inject(ModalController);
  private readonly _convertPositionsService = inject(ConvertPositionsService);
  private readonly _destroyRef = inject(DestroyRef);

  public readonly allWalletsAssets = this._portfolioBreakDownService.getEnabledWalletsAssets;
  public readonly portfolioTotalUsdValue = this._portfolioBreakDownService.portfolioTotalUsdValue;
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
      const {walletAddress, portfolio} = p;
      const total = portfolio.walletAssets
        ?.filter(data => (data?.value))
        .reduce((acc, curr) => acc + curr.value, 0) || 0;
      totals.set(walletAddress, total);
    });

    return totals;
  })

  ngOnInit() {
    if (!this.watchMode() && this._convertPositionsService.isCountdownExpired()) {
      this.openConvertPositionsModal();
    }
    // this._shs.walletExtended$.pipe(this._utilService.isNotNullOrUndefined).subscribe(wallet =>{

    //    this._portfolioService.getWalletHistory(wallet.publicKey.toBase58())
    // })

  }

  // public walletHistory: WritableSignal<TransactionHistory[]> = this._portfolioService.walletHistory

  /**
   * Opens the convert positions modal if there are available positions to convert.
   * @description
   * Subscribes to the stake list observable and presents a modal dialog when positions are available.
   * The subscription is automatically cleaned up when the component is destroyed.
   * @example
   * // Assuming this._convertPositionsService.getStakeLst$ emits [position1, position2]
   * openConvertPositionsModal(); // Opens the modal with available positions
   */
  private openConvertPositionsModal() {
    this._convertPositionsService.getStakeLst$
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(async (lst) => {
        if (lst.length > 0) {
          va.track('lst to hubSOL', { event: 'convert to hubSOL open' })
          const modal = await this._modalCtrl.create({
            component: ConvertPositionsModalComponent,
            cssClass: 'convert-to-hubSOL-modal',
          });
          await modal.present();
        }
      })
  }
}
