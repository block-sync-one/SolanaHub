import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ConvertToHubSOLBoxComponent } from './convert-to-hub-sol-box.component';

describe('ConvertToHubSOLBoxComponent', () => {
  let component: ConvertToHubSOLBoxComponent;
  let fixture: ComponentFixture<ConvertToHubSOLBoxComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConvertToHubSOLBoxComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ConvertToHubSOLBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
