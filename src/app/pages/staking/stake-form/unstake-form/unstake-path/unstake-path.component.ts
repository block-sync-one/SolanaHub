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
  IonCol, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, waterOutline, flash, time, informationCircleOutline, funnelOutline } from 'ionicons/icons';
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
    IonContent
  ]
})
export class UnstakePathComponent implements OnInit, OnChanges {
  @ViewChild('selectedPath', { static: false }) selectedPath: IonRadioGroup;
  @Input() unstakePath: string = 'instant'
  @Output() onSelectPath = new EventEmitter()
  constructor() {
    addIcons({flash,informationCircleOutline,funnelOutline,time,lockClosedOutline,waterOutline});
  }

  ngOnInit() {
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
}
