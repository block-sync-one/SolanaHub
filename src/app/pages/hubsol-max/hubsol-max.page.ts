import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { HubsolMaxService } from './hubsol-max.service';
@Component({
  selector: 'app-hubsol-max',
  templateUrl: './hubsol-max.page.html',
  styleUrls: ['./hubsol-max.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, PageHeaderComponent]
})
export class HubsolMaxPage implements OnInit {

  constructor(private _hubsolMaxService: HubsolMaxService) { }

  ngOnInit() {
    this._hubsolMaxService.initFarmPool();
  }

}
