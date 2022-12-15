import { Component } from '@angular/core';
import { connectionConfigProviderFactory, ConnectionStore, WalletStore } from '@heavy-duty/wallet-adapter';
import {
  ExodusWalletAdapter,
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { SolanaUtilsService, UtilsService } from './services';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {

  // readonly isReady$ = this._walletStore.connected$
  constructor(
    public router: Router,
    private _connectionStore: ConnectionStore,
    private _walletStore: WalletStore,
    private SolanaUtilsService:SolanaUtilsService,
    private _utilsService: UtilsService
  ) { }
  readonly currentTheme$ = this._utilsService.theme$;
  async ngOnInit(): Promise<void> {
    connectionConfigProviderFactory({
      commitment: "confirmed",
    })

    this._connectionStore.setEndpoint(environment.solanaCluster)
    this._walletStore.setAdapters([
      new PhantomWalletAdapter(),
      new ExodusWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter(),
      new SolletWalletAdapter(),
      new LedgerWalletAdapter()
    ]);

  }


}
