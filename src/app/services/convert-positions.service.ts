import { inject, Injectable } from '@angular/core';
import { VirtualStorageService } from "@app/services/virtual-storage.service";
import { StorageKey } from "@app/enums";

@Injectable({
  providedIn: 'root'
})
export class ConvertPositionsService {
  private _vrs = inject(VirtualStorageService);

  isCountdownExpired(): boolean {
    return this._vrs.isCountdownExpired(StorageKey.STAKE_HUB_SOL);
  }

  hide() {
    this._vrs.hideWithOneMonthCooldown(StorageKey.STAKE_HUB_SOL);
  }
}

