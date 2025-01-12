import { Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewChild, WritableSignal, effect, signal } from '@angular/core';
import {
  IonImg,
  IonItem,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonRow,
  IonCol, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { lockClosedOutline, waterOutline } from 'ionicons/icons';
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
    IonCol
  ]
})
export class StakePathComponent implements OnInit, OnChanges {
  @ViewChild('selectedPath', { static: false }) selectedPath: IonRadioGroup;
  @Input() stakePath: string = 'native'
  @Output() onSelectPath = new EventEmitter()
  constructor() {
    addIcons({lockClosedOutline,waterOutline});
  }

  ngOnInit() {
  }
  
  selectPath(ev) {
    const value = ev?.detail?.value ?? this.stakePath
    this.onSelectPath.emit(value)
  }
  
  ngOnChanges(changes): void {
    this.selectPath(this.stakePath)
  }
}
