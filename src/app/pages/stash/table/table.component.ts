import { CurrencyPipe, DecimalPipe, KeyValuePipe } from '@angular/common';
import { Component, effect, Input, OnInit, signal, TemplateRef, ViewChild, Output, EventEmitter, OnChanges, SimpleChanges, output, ViewChildren, QueryList, computed } from '@angular/core';
import { IonRow, IonCol,  IonButton, IonImg, IonIcon, IonToggle, IonLabel, IonChip, IonText, IonCheckbox, IonAccordion, IonItem, IonAccordionGroup, IonSkeletonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowUpOutline, funnelOutline, linkOutline } from 'ionicons/icons';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { MftModule } from 'src/app/shared/layouts/mft/mft.module';
import { StashAsset, StashGroup } from '../stash.model';
import { PopoverController, ModalController } from '@ionic/angular';
import { RangeBoxComponent } from './range-box/range-box.component';
import { StashService } from '../stash.service';
import { StashModalComponent } from '../stash-modal/stash-modal.component';
import { UtilService } from 'src/app/services/util.service';
import { TooltipModule } from 'src/app/shared/layouts/tooltip/tooltip.module';
import { Observable } from 'rxjs';
@Component({
  selector: 'stash-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  standalone: true,
  imports:[
    TooltipModule,
    IonIcon,
    ChipComponent,
    IonRow,
    IonCheckbox,
    IonAccordionGroup,
    IonAccordion,
    IonButton,
    IonLabel, 
    IonImg,
    IonToggle,
    MftModule,
    DecimalPipe,
    CurrencyPipe,
    KeyValuePipe
  ]
})
export class TableComponent  implements OnChanges {
  @Input() showBalance: Observable<boolean>
  @ViewChild('checkboxTpl', { static: true }) checkboxTpl: TemplateRef<any> | any;
  @ViewChild('tokenTpl', { static: true }) tokenTpl: TemplateRef<any> | any;
  @ViewChild('accountTpl', { static: true }) accountTpl: TemplateRef<any> | any;
  @ViewChild('amountTpl', { static: true }) amountTpl: TemplateRef<any> | any;
  @ViewChild('valueTpl', { static: true }) valueTpl: TemplateRef<any> | any;
  @ViewChild('actionTpl', { static: true }) actionTpl: TemplateRef<any> | any;
  @ViewChild('sourceTpl', { static: true }) sourceTpl: TemplateRef<any> | any;
  @ViewChild('platformIconTpl', { static: true }) platformIconTpl: TemplateRef<any> | any;
  @ViewChildren('checkAsset') checkAssets: QueryList<IonCheckbox>

  @Output() swapTohubSOLChange = new EventEmitter<boolean>();
  @Input() stash: StashGroup;

  public swapTohubSOL = false;
  public portfolioShare = 3
  constructor(
    private _stashService: StashService,
    public _popoverController: PopoverController,
    private _modalCtrl: ModalController,
    private _util: UtilService
  ) { 
    addIcons({funnelOutline,arrowUpOutline,linkOutline});
  }
  public tableColumn = signal([])
  public tableData = signal([])
  public tempTableData = []
  public selectedData = signal<StashAsset[]>([])
  public resetCheckAll = false
  private createTableColumnConfig(assetTitle: string, accountOrPlatformTitle: string) {
    return [
      { key: 'select', width: '6%', cellTemplate: this.checkboxTpl, cssClass: { name: 'select-box', includeHeader: true } },
      { key: 'asset', title: assetTitle, width: '30%', cellTemplate: this.tokenTpl, cssClass: { name: 'ion-text-left', includeHeader: true } },
      { key: accountOrPlatformTitle.toLowerCase(), title: accountOrPlatformTitle, width: '15%', cellTemplate: this.getTemplateForTitle(accountOrPlatformTitle), cssClass: { name: 'ion-text-capitalize ion-text-left', includeHeader: true } },
      { key: 'value', title: 'Extractable', width: '17%', cellTemplate: this.valueTpl, cssClass: { name: 'ion-text-left', includeHeader: true } },
      { key: 'source', title: 'Source', width: '17%', cellTemplate: this.sourceTpl, cssClass: { name: 'ion-text-left', includeHeader: true } },
      { key: 'action', title: '', width: '15%', cellTemplate: this.actionTpl, cssClass: { name: 'ion-text-left', includeHeader: true } },
    ];
  }

  private getTemplateForTitle(title: string): TemplateRef<any> {
    return title === 'Platform' ? this.platformIconTpl : this.accountTpl;
  }

  ngOnChanges(): void {
    const isZeroYieldZone = this.stash.label === 'zero yield zones';
    this.tableColumn.set(this.createTableColumnConfig(
      isZeroYieldZone ? 'Pool' : 'Asset',
      isZeroYieldZone ? 'Platform' : 'Account'
    ));
    this.tableData.set(this.stash.data.assets.sort((a, b) => a.value - b.value));
    this.selectedData.set(this.tableData().filter(item => item.checked))
  }

  onSwapTohubSOLChange(ev){
    this.swapTohubSOL = ev
  }
  @ViewChild('accordionGroup', { static: true }) accordionGroup: IonAccordionGroup;

  public async openRangeBox(event: any) {

    const modal = await this._popoverController.create({
      component: RangeBoxComponent,
      cssClass: 'range-popover',
      mode: 'ios',
      event: event,
      side:'top',
      showBackdrop: false,
      componentProps: {
        portfolioShare: this.portfolioShare
      }
    })
    modal.present();
    const { data, role } = await modal.onWillDismiss();
    if(data){
      this.portfolioShare = data

      this._stashService.updateDustValueTokens(this.portfolioShare )
    }
  }

  alternateClick(ev){
    if(ev.target.id !== 'toggle-btn'){
      ev.stopPropagation()
    }
  }
  flipArrow = false;
  toggleAccordion = () => {
    this.flipArrow = !this.flipArrow
    const nativeEl = this.accordionGroup;
    if (nativeEl.value === 'first') {
      nativeEl.value = undefined;
    } else {
      nativeEl.value = 'first';
    }
  };

  updateSelectedData(ev){

    if(Array.isArray(ev)){
      this.selectedData.set(ev.filter(item => item?.checked))
    }else{
      if(ev?.checked){
        this.selectedData.set([...this.selectedData(), {...ev.value, checked: true}])
      }else {
        this.selectedData.set(this.selectedData().filter(item => item.id !== ev.value.id))
      }
    }
  }

  showUnknownSource(ev){
    this._stashService.getZeroValueAssetsByBalance(ev.detail.checked)


    this.resetCheckAll = !this.resetCheckAll
  }

  async openStashPopup(event: StashAsset[]) {

    const modal = await this._modalCtrl.create({
      component: StashModalComponent,
      componentProps: {
        stashAssets: event,
        actionTitle: event[0].action,
        swapTohubSOL: this.swapTohubSOL
      },
      cssClass: 'modal-style'
    });
    modal.present();

  }

  public fixedNumber(value: any): string {
    return this._util.fixedNumber(value)
  }

  isRowSelected(row: StashAsset){
    return this.selectedData().some(item => item.id === row.id && item.checked)
  }

  isSelected(row: any): boolean {
    return this.selectedData().some(item => item.id === row.id);
  }
}
