import { Component, OnInit, inject } from '@angular/core';
import { IonTitle, IonImg } from "@ionic/angular/standalone";
import { ChipComponent } from '../chip/chip.component';
import { ModalController } from '@ionic/angular';
import { VirtualStorageService } from 'src/app/services';

@Component({
  selector: 'news-feed',
  templateUrl: './news-feed.component.html',
  styleUrls: ['./news-feed.component.scss'],
  standalone: true,
  imports: [IonImg, IonTitle, ChipComponent]
})
export class NewsFeedComponent implements OnInit {
  private _modalCtrl = inject(ModalController)
  constructor(private _vrs:VirtualStorageService) { }

  dismissModal(){
    this._modalCtrl.dismiss()
    this._vrs.localStorage.saveData('newsFeedClosed', JSON.stringify({date: new Date().toISOString()}))

  }
  ngOnInit() {

   }

   mainFeed = {
    title: "Introducing Hubra",
    type: "feature",
    color: "secondary",
    image: "/assets/hubra.png",
    description: `The power of a CEX, with the freedom of DeFi.<br/> Subscribe to the new app release, become an early beta access user, and earn Matter. <a href='https://hubra-welcome.solanahub.app/' target='_blank' >Learn more</a>`
  }
  feed = [
    {
      title: "Multi-wallet support",
      type: "feature",
      color: "secondary",
      description: `View multiple wallets and get a full breakdown of your holdings across all registered wallets`
    },
    {
      title: "hubSOL boosted rewards",
      description: "all solanahub platform fees are now been utilize to improve hubSOL APY",
      type: "boost",
      color: "active",
      image: "assets/images/news-feed/news-1.png"
    },
    {
      title: "Join Our Community",
      description: "Become a member of our <a href='https://discord.gg/bcVhnpww7N' target='_blank'>Discord Community</a> to stay updated with the latest news and announcements and get custom role",
      type: "informative",
      color: "focus",
      image: "assets/images/news-feed/news-1.png"
    },
    {
      title: "Automatic priority fees",
      description: "Priority fees are now automatically adjusted to your transactions base on network congestion",
      type: "feature",
      color: "secondary",
      image: "assets/images/news-feed/news-1.png"
    },
    
  ]
}
