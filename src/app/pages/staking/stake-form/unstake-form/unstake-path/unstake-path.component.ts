import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild, WritableSignal, effect, signal } from '@angular/core';
import { SolanaHelpersService } from '@app/services';
import {
  IonImg,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonRow,
  IonPopover,
  IonContent,
  IonCol, IonIcon, IonSkeletonText} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, waterOutline, flash, time, informationCircleOutline, funnelOutline } from 'ionicons/icons';
import { catchError } from 'rxjs/operators';
import { take } from 'rxjs';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { TooltipModule } from 'src/app/shared/layouts/tooltip/tooltip.module';
@Component({
  selector: 'unstake-path',
  templateUrl: './unstake-path.component.html',
  styleUrls: ['./unstake-path.component.scss'],
  standalone: true,
  imports: [IonIcon, 
    IonImg,
    IonLabel,
    IonRadioGroup,
    IonRadio,
    IonRow,
    IonCol,
    ChipComponent,
    TooltipModule,
    IonPopover,
    IonContent,
    IonSkeletonText,
    DecimalPipe,
    PercentPipe
  ]
})
export class UnstakePathComponent implements OnInit, OnChanges {
  @Input() swapReceive: number = 0
  @Input() slowUnstakeReceive: number = 0
  @Input() loading: boolean = false
  @ViewChild('selectedPath', { static: false }) selectedPath: IonRadioGroup;
  @Input() unstakePath: string = 'instant'
  @Output() onSelectPath = new EventEmitter()
  public ETA: string = ''
  constructor(private _shs: SolanaHelpersService) {
    addIcons({flash,informationCircleOutline,funnelOutline,time,lockClosedOutline,waterOutline});
  }

  ngOnInit(): void {
    this._shs.getEpochInfo()
      .pipe(
        take(1),
        catchError((err) => {
          console.error('Failed to load epoch info:', err);
          return [];
        })
      ).subscribe({
        next: (data) => {
          
          this.ETA = data.ETA;
          
        }
      });
  }
  
  selectPath(ev) {
    const value = ev?.detail?.value ?? this.unstakePath
    this.onSelectPath.emit(value)
  }
  
  ngOnChanges(changes): void {
    this.selectPath(this.unstakePath)
  } 

  openTooltip() {
    console.log('openTooltip')
  }

  getUnstakePercentageDiff() {
    return ((this.slowUnstakeReceive - this.swapReceive) / this.swapReceive) 
  }
}
