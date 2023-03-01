import { Component } from '@angular/core';
import { connectionConfigProviderFactory, ConnectionStore, WalletStore } from '@heavy-duty/wallet-adapter';
import {
  BackpackWalletAdapter,
  BraveWalletAdapter,
  ExodusWalletAdapter,
  GlowWalletAdapter,
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';


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
  ) { }
  async ngOnInit(): Promise<void> {
    connectionConfigProviderFactory({
      commitment: "confirmed",
    })

    this._connectionStore.setEndpoint(environment.solanaCluster)
    this._walletStore.setAdapters([
      new PhantomWalletAdapter(),
      new BackpackWalletAdapter,
      new SolflareWalletAdapter(),
      new SlopeWalletAdapter(),
      new BraveWalletAdapter(),
      new GlowWalletAdapter(),
      new ExodusWalletAdapter(),
      new LedgerWalletAdapter()
    ]);

  }


}
