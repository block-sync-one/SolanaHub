import { TestBed } from '@angular/core/testing';

import { StakeEpochService } from './stake-epoch.service';

describe('StakeEpochService', () => {
  let service: StakeEpochService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StakeEpochService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
