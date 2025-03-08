import { enableProdMode } from '@angular/core';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { provideHttpClient } from '@angular/common/http';
import { provideWalletAdapter } from '@heavy-duty/wallet-adapter';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';

import {
  BrowserAnimationsModule,
  provideAnimations,
} from '@angular/platform-browser/animations';
import { inject } from '@vercel/analytics';
inject({mode: "production"});

if (environment.production) {
  enableProdMode();

}

bootstrapApplication(AppComponent, {
  providers: [
    provideWalletAdapter({
      autoConnect: true,
      adapters: [new UnsafeBurnerWalletAdapter()],
    }),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideAnimations(),
    provideIonicAngular(),
    provideHttpClient(),
    provideRouter(routes), provideClientHydration(),
  ],
});
