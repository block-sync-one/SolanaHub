import { Component, OnInit } from '@angular/core';
import { IonImg, IonButton } from "@ionic/angular/standalone";
import { VirtualStorageService } from 'src/app/services';

@Component({
  selector: 'news-feed',
  templateUrl: './news-feed.component.html',
  styleUrls: ['./news-feed.component.scss'],
  standalone: true,
  imports: [IonImg, IonButton]
})
export class NewsFeedComponent implements OnInit {
  constructor(private _vrs:VirtualStorageService) { }

  ngOnInit() {

   }

   navigateToHubra(){
    window.open('https://hubra.app?utm_source=solanahub&utm_medium=modal', '_blank');
   }

}
