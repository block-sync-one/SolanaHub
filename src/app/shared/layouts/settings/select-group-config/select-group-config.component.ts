import { AfterViewInit, Component, Inject, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import {
  IonLabel,
  IonSegmentButton,
  IonAvatar,
  IonSegment,
   IonImg,
   IonText, IonInput, IonIcon } from '@ionic/angular/standalone';
import { Config } from '../../../../models/settings.model';
import { VirtualStorageService } from 'src/app/services/virtual-storage.service';
import { SolanaHelpersService, ToasterService } from 'src/app/services';
import { DOCUMENT, JsonPipe } from '@angular/common';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { addIcons } from 'ionicons';
import { moonOutline, sunnyOutline } from 'ionicons/icons';
@Component({
  selector: 'select-group-config',
  templateUrl: './select-group-config.component.html',
  styleUrls: ['./select-group-config.component.scss'],
  standalone: true,
  imports:[
    IonLabel,
    IonSegmentButton,
    IonAvatar,
    IonSegment,
     IonImg,
     JsonPipe,
     IonInput,
     ChipComponent,
     IonIcon
  ]
})
export class SelectGroupConfigComponent  implements AfterViewInit {
  @Input() configType: 'RPC' | 'explorer' | 'priority-fee' | 'theme'
  @Input() title: string;
  @Input() configs: Config[];
  public defaultSelection: Config = null;
  constructor(
    private _renderer: Renderer2,
    private _toastService: ToasterService,
    private _vrs: VirtualStorageService,
    private _shs: SolanaHelpersService,
    @Inject(DOCUMENT) private document: Document,
    ) {
      addIcons({moonOutline,sunnyOutline});
     }

  ngAfterViewInit() {
    setTimeout(() => {
      if(this.configs){
        const findStoredSelection = this.configs.find(c => c.name === this.getStoredSelection()?.name) || this.configs[0];
        this.defaultSelection = findStoredSelection 
      }
    });
  }
  selectConfig(event):void{
   const config = event.detail.value
   this.defaultSelection = config
    if(config.name != 'Custom RPC'){
      this.storeSelection(config);
      // update for UI purposes
      this._toastService.msg.next({message:`${this.configType} updated`, segmentClass:'toastInfo'})
    }
    if(this.configType === 'RPC'){
      const rpcURL = this.defaultSelection.value
      this._shs.updateRPC(rpcURL)
    }
    if(this.configType === 'theme'){
      if(config.value === 'dark'){
        this.enableDarkTheme();
      }else{
        this.enableLightTheme();
      }
    }
  }
  storeSelection(selection: Config): void{
    this._vrs.localStorage.saveData(this.configType,JSON.stringify(selection))
  }
  getStoredSelection():Config{
    // console.log(JSON.parse(this._localStorage.getData(this.configType)));
    const config  = JSON.parse(this._vrs.localStorage.getData(this.configType))

   return config
  }
  customRPC(ev){
    const rpcURL = ev.detail.value
    this.defaultSelection.value = rpcURL;
    this.storeSelection(this.defaultSelection)

    this._toastService.msg.next({message:`${this.configType} updated`, segmentClass:'toastInfo'})
    this._shs.updateRPC(rpcURL)
    }

    public enableDarkTheme() {
      this._renderer.addClass(this.document.body, 'dark-theme');
    }
    public enableLightTheme() {
      this._renderer.removeClass(this.document.body, 'dark-theme');
    }
    
  }

