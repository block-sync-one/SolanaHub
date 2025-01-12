import {
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
  Signal,
  Output,
  EventEmitter,
  Input,
  signal,
  computed
} from '@angular/core';
import { PortfolioService, UtilService } from 'src/app/services';
import { ChartConfiguration } from 'chart.js';
import Chart from 'chart.js/auto'
import { AsyncPipe, NgClass, NgStyle } from '@angular/common';
import { IonRow, IonCol, IonSpinner, IonIcon } from '@ionic/angular/standalone';
import { PortfolioBreakdownService } from "../../../services";
import { BehaviorSubject, Subject } from 'rxjs';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

@Component({
  selector: 'portfolio-breakdown',
  templateUrl: './portfolio-breakdown.component.html',
  styleUrls: ['./portfolio-breakdown.component.scss'],
  standalone: true,
  imports: [IonIcon, AsyncPipe, NgClass, NgStyle, IonRow, IonCol, IonSpinner]
})
export class PortfolioBreakdownComponent {
  @Input() chartText = '';
  public readonly _portfolioBreakDownService = inject(PortfolioBreakdownService)
  public readonly utilService = inject(UtilService)
  @ViewChild('breakdownChart', { static: false }) breakdownChart: ElementRef;

  constructor(private _portfolioService: PortfolioService) {
    addIcons({ eyeOutline, eyeOffOutline })
    effect(() => {
      if (this.assets() && this.assets().length > 0) {
        setTimeout(() => {
          this.createGroupCategory()
        }, 300);
      }
    })
  }
  // public stashTotalUsdValue = computed(() => this.assets()?.filter(data => data.value).reduce((accumulator, currentValue) => accumulator + currentValue.value, 0))


  public readonly showBalance = new BehaviorSubject<boolean>(false);
  public readonly portfolioTotalValue = computed(() => this.assets()?.filter(data => data.value).reduce((accumulator, currentValue) => accumulator + currentValue.value, 0))
  public readonly assetClassValue = computed(() => {
    const assets = this.assets();

    if (!assets) return null;
    return assets
      .map(assetClass => ({
        group: assetClass?.label ? (assetClass?.label === 'NFTs' ? 'NFTs' : assetClass?.label.replace(/([A-Z])/g, ' $1').trim()) : assetClass?.label,
        value: assetClass?.value,
        color: this.colorPicker(assetClass?.label),
        // excluded: this.excludedAssets().has(assetClass?.label)
      }))
      .reduce((a, c) => {
        const obj = a.find((obj) => obj.group === c.group);
        if (!obj) {
          a.push(c);
        } else {
          obj.value += c.value;
          // obj.excluded = obj.excluded && c.excluded;
        }
        return a;
      }, [])
      .filter(asset => asset.value > 0)
      .sort((a, b) => b.value - a.value);
  });

  private colorPicker(assetClass: string): string {
    let color = ''
    switch (assetClass) {
      case 'Wallet':
        color = '#341663'
        break;
      case 'Staked':
        color = '#7209B7'
        break;
      case 'NFTs':
      case 'unstaked overflow':
        color = '#F7E8FF'
        break;

      case 'LiquidityPool':
      case 'zero yield zones':
        color = '#560BAD'
        break;
      case 'Lending':
      case 'zero value assets':
        color = '#B5179E'
        break;
      case 'Rewards':
        color = '#F72585'
        break;
      case 'Airdrop':
        color = '#b82568'
        break;
      case 'Deposit':
      case 'dust value':
        color = '#E9CDC2'
        break;
      case 'Farming':
        color = '#341663'
        break;
      case 'Vesting':
        color = '#b58ef2'
        break;
      case 'Leverage':
        color = '#8ea3f2'
        break;
      default:
        color = this.getRandomColor()
        break;
    }

    return color
  }

  @Output() totalAssetsChange = new EventEmitter<number>();
  @Input() assets: Signal<any[]> = signal([]);
  chartData: Chart<'doughnut' | 'pie', number[], unknown>;


  public toggleHideBalance() {
    this.showBalance.next(!this.showBalance.value)
    this.chartData.update();
  }

  private getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  private createGroupCategory() {
    this.chartData ? this.chartData.destroy() : null
    const chartEl = this.breakdownChart?.nativeElement
    const filterPortfolioLowValue = this.assetClassValue().filter((assets: any) => !assets.excluded);
    const groupNames = filterPortfolioLowValue.map((assets: any) => assets.group.charAt(0).toUpperCase() + assets.group.slice(1))
    const groupColors = filterPortfolioLowValue.map((assets: any) => assets.color)
    const groupValue = filterPortfolioLowValue.map((assets: any) => assets.value)

    const config2: ChartConfiguration<'doughnut' | 'pie'> = {
      type: this.chartText ? 'doughnut' : 'pie',

      data: {
        labels: groupNames,
        datasets: [{
          parsing: false,
          // label: '',
          data: groupValue,
          backgroundColor: groupColors,
          hoverOffset: 4,
          borderWidth: 0,

        }]
      },
      options: {
        cutout: this.chartText ? '82%' : '0',
        layout: {
          padding: 4
        },
        elements: {
          arc: {
            borderWidth: 0,
            borderAlign: 'inner'
          }
        },
        plugins: {
          legend: {
            display: false
          }
        },
        responsive: true,
        maintainAspectRatio: false
      },

      plugins: [{
        id: 'centerText',
        beforeDraw: (chart: any) => {
          const ctx = chart.ctx;
          const width = chart.width;
          const height = chart.height;

          ctx.restore();
          if (this.chartText) {
            // Calculate total
            const total = groupValue.reduce((sum: number, value: number) => sum + value, 0);
            const formattedTotal = `$${this.utilService.formatBigNumbers(total)}`;
            // const platformTheme = this.utilService.theme
            ctx.font = '13px Inter';
            ctx.color = '#B84794'
            ctx.fontWeight = '500'
            ctx.lineHeight = '18px'
            ctx.fillStyle = '#B84794';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.chartText, width / 2, height / 2 - 13); // Move up by 12px

            // Value text
            ctx.font = '24px Inter';
            ctx.color = '#B84794'
            ctx.fontWeight = '600'
            ctx.lineHeight = '24px'
            ctx.fillStyle = '#B84794';
            if (!this.showBalance.value) {
              ctx.fillText(formattedTotal, width / 2, height / 2 + 13); // Move down by 12px
            } else {
              ctx.fillText('****', width / 2, height / 2 + 15); // Move up by 12px
            }
          }
          ctx.save();
        }
      }]
    }

    this.chartData = new Chart(chartEl, config2)
  }

  toggleAssetExclusion(group: string): void {
    this._portfolioBreakDownService.toggleAssetExclusion(group)
    this.createGroupCategory();
  }

  onChartClick(event: MouseEvent) {
    if (!this.chartData) return;

    const points = this.chartData.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);

    if (points.length) {
      const firstPoint = points[0];
      const label = this.chartData.data.labels[firstPoint.index];
      this.toggleAssetExclusion(label as string);
    }
  }
}
