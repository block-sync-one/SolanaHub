import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { MarinadeUnstakeTicketComponent } from './marinade-unstake-ticket.component';

describe('MarinadeUnstakeTicketComponent', () => {
  let component: MarinadeUnstakeTicketComponent;
  let fixture: ComponentFixture<MarinadeUnstakeTicketComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MarinadeUnstakeTicketComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(MarinadeUnstakeTicketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
