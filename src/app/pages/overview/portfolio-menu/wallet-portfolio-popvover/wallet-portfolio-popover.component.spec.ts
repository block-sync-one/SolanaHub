import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { WalletPortfolioPopoverComponent } from './wallet-portfolio-popover.component';

describe('WalletPortfolioPopvoverComponent', () => {
  let component: WalletPortfolioPopoverComponent;
  let fixture: ComponentFixture<WalletPortfolioPopoverComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ WalletPortfolioPopoverComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(WalletPortfolioPopoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
