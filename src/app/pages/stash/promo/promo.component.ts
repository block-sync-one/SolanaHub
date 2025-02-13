import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import {IonButton, IonImg, IonText, IonLabel, IonSkeletonText } from '@ionic/angular/standalone';
import lottie from "lottie-web";
import {
  style,
  animate,
  trigger,
  transition,
} from "@angular/animations";
import { CurrencyPipe, NgIf } from '@angular/common';
import va from '@vercel/analytics'
@Component({
  selector: 'promo',
  templateUrl: './promo.component.html',
  styleUrls: ['./promo.component.scss'],
  standalone: true,
  imports: [NgIf,IonButton, IonImg, IonLabel, IonText, CurrencyPipe, IonSkeletonText],
  animations: [
    trigger('easeOut', [
      transition('* => void', [
          style({
              opacity: 1
          }),
          animate("300ms ease-in-out", style({
              opacity: 0
          }))
      ])
    ]),
    trigger('easeIn', [
      transition('void => *', [
        style({
            opacity: 0
        }),
        animate("500ms 300ms ease-in-out", style({
            opacity: 1
        }))
    ]),
    ]),
    trigger("fadeAnimation", [
      transition("false=>true", [
        style({ opacity: 0 }),
        animate("300ms", style({ opacity: 1 }))
      ]),
      //when we write '500ms  100ms' means that the animation spend 500ms, and start afer 100ms
      transition("true=>false", [animate("300ms 600ms", style({ opacity: 0 }))])
    ]),
    
  ]
})
export class PromoComponent implements AfterViewInit {
  @Input() set estimateStashValue(value: number) {

    this._estimateStashValue = value;
    // You can add any additional logic here when the value changes
    this.handleEstimateValueChange();
  }
  get estimateStashValue(): number {
    return this._estimateStashValue;
  }
  private _estimateStashValue: number = null;

  private handleEstimateValueChange() {
    // Add any specific logic you need when the value changes
    // console.log('Estimate value changed:', this._estimateStashValue);
  }

  @ViewChild('animationEl', { static: false }) animationEl: ElementRef;
  public wordCarousel = ["Dust value", "Stake accounts", "DeFi positions"];
  public wordCounter = -1;
  toggle: boolean = true;
  @Output() onStartAnalyze = new EventEmitter()
  @ViewChild("wordCarousel", { static: false }) wordCarouselEl: ElementRef;
  public preview = true;
  constructor() { }

  startAnalyze(){
    va.track('stash', {
      state: 'promo',
      action: 'start analyze'
    })
    this.preview = false;
    setTimeout(() => {
      
      this.startAnim()
    });

    // setTimeout(() => {
      this.onStartAnalyze.emit()
    // }, 5000);
  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.toggle = false;
    })

    va.track('stash', {
      state: 'promo',
      action: 'loaded'
    })

  }
  nextWord(event: any) {
    this.toggle = !this.toggle;
    if (event.fromState)
      this.wordCounter = (this.wordCounter + 1) % this.wordCarousel.length;
  }

  startAnim(){
    lottie.loadAnimation({
      container: this.animationEl.nativeElement, // the dom element that will contain the animation
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'assets/stash-anim.json' // the path to the animation json
    });
  }
}
