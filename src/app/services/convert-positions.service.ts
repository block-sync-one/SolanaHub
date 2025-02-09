import { computed, inject, Injectable, signal } from '@angular/core';
import { VirtualStorageService } from "@app/services/virtual-storage.service";
import { StorageKey, Utils } from "@app/enums";
import { StakeService } from "@app/pages/staking/stake.service";
import { LiquidStakeToken } from "@app/models";
import {map, Observable, take, tap} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ConvertPositionsService {
  private readonly _vrs = inject(VirtualStorageService);
  private readonly _stakeService = inject(StakeService);

  private readonly data = signal<(LiquidStakeToken & { checked: boolean })[]>([])
  public readonly lst = computed(() => this.data())

  isCountdownExpired(): boolean {
    return this._vrs.isCountdownExpired(StorageKey.STAKE_HUB_SOL);
  }

  hide() {
    this._vrs.hideWithOneMonthCooldown(StorageKey.STAKE_HUB_SOL);
  }

  /**
   * Returns an observable of stake positions with filtered and transformed data.
   * @description
   * Takes the stake positions observable, filters out HUB_SOL and positions with balance <= 1,
   * adds a checked property to each position, and stores the result in the data store.
   * @returns Observable<any(LiquidStakeToken & { checked: boolean }[]> Observable containing the filtered and transformed stake positions
   * @example
   * // Assuming stakePositions$ emits:
   * // [
   * //   { symbol: 'HUB_SOL', balance: 0.5 },
   * //   { symbol: 'SOL', balance: 2 },
   * //   { symbol: 'USDC', balance: 1.5 }
   * // ]
   * // Result will be:
   * // [
   * //   { symbol: 'SOL', balance: 2, checked: true },
   * //   { symbol: 'USDC', balance: 1.5, checked: true }
   * // ]
   */
  public getStakeLst$: Observable<(LiquidStakeToken & { checked: boolean })[]> =
    this._stakeService.stakePositions$
      .pipe(take(1))
      .pipe(map(({liquid}) => liquid.filter(lst => lst.symbol !== Utils.HUB_SOL && lst.balance > 1)))
      .pipe(map((p) => p.map((v) => ({ ...v, checked: true}))))
      .pipe(tap((value) => this.data.set(value)))
}

