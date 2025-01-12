import { Component, Input, OnInit, inject } from '@angular/core';
import { ProposalPreviewComponent } from './proposal-preview/proposal-preview.component';
import { IonImg, IonLabel, IonRow, IonCol, IonSkeletonText } from '@ionic/angular/standalone';
import { Gov, Proposal } from 'src/app/models/dao.model';
import { ModalController } from '@ionic/angular';
import {  ProposalPopupComponent } from './proposal-popup/proposal-popup.component';
import { JsonPipe } from '@angular/common';
@Component({
  selector: 'dao-group',
  templateUrl: './dao-group.component.html',
  styleUrls: ['./dao-group.component.scss'],
  standalone: true,
  imports: [
    ProposalPreviewComponent,
    IonImg,
    IonLabel,
    IonRow,
    IonCol,
    IonSkeletonText,
    JsonPipe
  ]
})
export class DaoGroupComponent implements OnInit {
  @Input() gov: Gov = null
  private _modalCtrl= inject(ModalController);
  constructor() { }

  ngOnInit() {
    console.log(this.gov);

  }
  async openProposal(proposal: Proposal){
    const modal = await this._modalCtrl.create({
      component: ProposalPopupComponent,
      componentProps: {proposal, govInfo:{name:this.gov.name, logoURI: this.gov.logoURI}},
      cssClass: 'modal-style'
    });
    modal.present();
  }
}
