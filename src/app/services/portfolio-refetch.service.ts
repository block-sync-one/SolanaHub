import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

interface PortfolioFetch {
  shouldRefresh: boolean;
  fetchType: 'full' | 'partial'
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioFetchService {

  private refetchSubject = new Subject<PortfolioFetch>();

  syncMainAddressPortfolio() {
    return this.refetchSubject.asObservable();
  }

  triggerFetch(fetchType: 'full' | 'partial' = 'partial') {
    this.refetchSubject.next({shouldRefresh: true, fetchType});
  }
}
