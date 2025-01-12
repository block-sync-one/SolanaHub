import { DecimalPipe, NgClass, NgFor, NgStyle } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Tier } from 'src/app/models';
import { IonImg, IonButton, IonSkeletonText, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { personAddOutline } from 'ionicons/icons';
@Component({
  selector: 'loyalty-path',
  templateUrl: './loyalty-path.component.html',
  styleUrls: ['./loyalty-path.component.scss'],
  standalone: true,
  imports: [IonIcon, DecimalPipe ,IonSkeletonText, IonButton, IonImg, NgStyle,NgClass, NgFor],
})
export class LoyaltyPathComponent  implements OnChanges, AfterViewInit {
  @ViewChild('loyaltyPathBody') loyaltyPathBody: ElementRef;
  private isDragging = false;
  private startX: number;
  private scrollLeft: number;

  @Input() tiers: Tier[] = [];
  @Input() daysLoyal: number = 0;
  @Output() openReferAFriendModal: EventEmitter<void> = new EventEmitter<void>();
  public nextTier: Tier | null = null;
  public daysRemainingToNextTier: number = 0
  constructor(){
    addIcons({personAddOutline})  
  }
ngAfterViewInit() {
    this.initDragToScroll();
  }

  private initDragToScroll() {
    const slider = this.loyaltyPathBody.nativeElement;

    const mouseDownHandler = (e: MouseEvent) => {
      this.isDragging = true;
      slider.classList.add('active');
      this.startX = e.pageX - slider.offsetLeft;
      this.scrollLeft = slider.scrollLeft;
    };

    const mouseUpHandler = () => {
      this.isDragging = false;
      slider.classList.remove('active');
    };

    const mouseMoveHandler = (e: MouseEvent) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - this.startX) * 2; // Scroll-fast
      slider.scrollLeft = this.scrollLeft - walk;
    };

    slider.addEventListener('mousedown', mouseDownHandler);
    slider.addEventListener('mouseleave', mouseUpHandler);
    slider.addEventListener('mouseup', mouseUpHandler);
    slider.addEventListener('mousemove', mouseMoveHandler);
  }
  ngOnChanges() {
    if(this.daysLoyal) {
        this.nextTier = this._getNextTier();
        this.daysRemainingToNextTier = this._daysRemainingToNextTier(this.nextTier);  
      
      }
  }
  // get next tier
  private _getNextTier(): Tier {
    let currentTierIndex = -1;
  
    for (let i = this.tiers.length - 1; i >= 0; i--) {
      if (this.daysLoyal >= this.tiers[i].loyaltyDaysRequirement) {
        currentTierIndex = i;
        break;
      }
    }
    if (currentTierIndex < this.tiers.length - 1) {
      return this.tiers[currentTierIndex + 1];
    }
    
    return this.tiers[this.tiers.length - 1];
  }
  private _daysRemainingToNextTier(nextTier: Tier): number {
    // return the days remaining to the next tier, if max return 0
    if (nextTier.loyaltyDaysRequirement <= this.daysLoyal) {
      return 0;
    }
    this.daysRemainingToNextTier = nextTier.loyaltyDaysRequirement - this.daysLoyal;
    return this.daysRemainingToNextTier;
  }
  public isTierSurpassed(tier: Tier): number {
    // determine if the tier is surpassed
    
    return this.daysLoyal >= tier.loyaltyDaysRequirement ? 1 : 0;
  }
  getTierContainerClasses(tier: Tier): { [key: string]: any } {
    const currentTierIndex = this.tiers.indexOf(tier);
    const nextTier = this.tiers[currentTierIndex + 1];
    const isPreviousCompleted = this.isTierSurpassed(tier);
    const isNextCompleted = nextTier && this.isTierSurpassed(nextTier);
  
    return {
      'tier-previous-completed': isPreviousCompleted && isNextCompleted,
      'tier-next-completed': !isPreviousCompleted,
      'tier-in-progress': isPreviousCompleted && !isNextCompleted
    };
  }
  public getColor(tier: string): string {
    switch (tier) {
      case 'degen':
        return '#B93815';
      case 'manlet':
        return '#7F56D9';
      case 'maxi':
        return '#ffc219'; 
      case 'diamond-hands':
        return '#2E90FA';
      default:
        return '#B93815';
    }
  }
}
