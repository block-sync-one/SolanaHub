import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild, WritableSignal, effect, signal } from '@angular/core';
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
import { lockClosedOutline, waterOutline, flash, time, informationCircleOutline, funnelOutline, colorWandOutline } from 'ionicons/icons';
import { catchError } from 'rxjs/operators';
import { take } from 'rxjs';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { TooltipModule } from 'src/app/shared/layouts/tooltip/tooltip.module';
import { PlatformFeeComponent } from '@app/shared/components/platform-fee/platform-fee.component';
import { ConvertPositionsService, NativeStakeService } from 'src/app/services';
@Component({
  selector: 'stake-path',
  templateUrl: './stake-path.component.html',
  styleUrls: ['./stake-path.component.scss'],
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
    PercentPipe,
    PlatformFeeComponent,
    TooltipModule
  ]
})
export class StakePathComponent implements OnInit, OnChanges {
  @Input() swapReceive: number = 0
  @Input() slowStakeReceive: number = 0
  @Input() loading: boolean = false
  @ViewChild('selectedPath', { static: false }) selectedPath: IonRadioGroup;
  @Input() stakePath: string = 'Liquid'
  @Input() nativeStakePathDisabled: boolean = false
  @Output() onSelectPath = new EventEmitter()


  constructor(private _nss: NativeStakeService, private _convertPositionsService: ConvertPositionsService) {
    addIcons({flash,colorWandOutline,time,informationCircleOutline,funnelOutline,lockClosedOutline,waterOutline});
  }
  public nativeAPY = signal(0)
  public liquidAPY = this._convertPositionsService.hubSOLAPY
  ngOnInit(): void {
    this._nss.getSolanaHubValidatorInfo().then(v => {
      this.nativeAPY.set(v.total_apy)
    })
  }
  
  selectPath(ev) {
    const value = ev?.detail?.value ?? this.stakePath
    this.onSelectPath.emit(value)
  }
  
  ngOnChanges(changes): void {
    this.selectPath(this.stakePath)
  } 


  getStakePercentageDiff() {
    return ((this.slowStakeReceive - this.swapReceive) / this.swapReceive) 
  }
}
