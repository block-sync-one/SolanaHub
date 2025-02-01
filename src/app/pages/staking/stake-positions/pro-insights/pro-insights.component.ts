import { AfterViewInit, Component, ElementRef, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { IonLabel, IonSegmentButton, IonSegment, IonSkeletonText, IonText, IonIcon, IonButton } from "@ionic/angular/standalone";
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { ProInsights, StakeAccount, StakeService } from '../../stake.service';
import { LiquidStakeToken } from '../../stake.service';
import { Chart, ChartConfiguration, ChartItem } from 'chart.js';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import zoomPlugin from 'chartjs-plugin-zoom';
import { SolanaHelpersService, UtilService } from 'src/app/services';
import { CopyTextDirective } from 'src/app/shared/directives/copy-text.directive';
import { FreemiumModule } from '@app/shared/layouts/freemium/freemium.module';

Chart.register(zoomPlugin);

@Component({
  selector: 'pro-insights',
  templateUrl: './pro-insights.component.html',
  styleUrls: ['./pro-insights.component.scss'],
  standalone: true,
  imports: [
    IonButton, 
    IonIcon, 
    CopyTextDirective, 
    IonText,
    DatePipe, 
    IonLabel, 
    ChipComponent,
    FreemiumModule,
    DecimalPipe
  ]
})

export class ProInsightsComponent implements OnChanges, AfterViewInit, OnDestroy {
  public utilService = inject(UtilService);
  private _stakeService = inject(StakeService);
  @Input() stakePosition: StakeAccount | LiquidStakeToken | any
  @Input() isOpen = false;
  @ViewChild('chartEl', { static: true }) chartEl: ElementRef;
  chartData: Chart;
  public stakeRewardsData = []
  totalRewards = null;
  public isLoading = true;
  constructor(private _shs: SolanaHelpersService) { }

  async ngAfterViewInit() {
    this.initChart();
    this.isLoading = false;
  }
  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    console.log(this.isOpen)
    if (this.isOpen) {
      this.isLoading = true;
      await this.getProInsights();
      this.isLoading = false;
      this.initChart();
    }
  }


  private initChart() {
    
    this.chartData ? this.chartData.destroy() : null
    const ctx = this.chartEl.nativeElement

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.isLoading ? Array(5).fill('Loading...') : this.stakeRewardsData.map(data => 
          `Epoch ${data.epoch}`),
          // ${this.utilService.datePipe.transform(data.date, 'shortDate')} /
          datasets: [{
          label: this.stakePosition.type === 'native' ? 'Rewards' : 'Value',
          data: this.isLoading ? Array(5).fill(0.5) : this.stakeRewardsData.map(data => data.reward),
          backgroundColor: this.isLoading ? 'rgba(200,200,200,0.3)' : 'rgba(184,71,148)',
          borderWidth: 0,
          animation: this.isLoading ? {
            duration: 1000,
            loop: true,
            delay: (context) => context.dataIndex * 100
          } : undefined
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { left: 0, right: 0, top: 10, bottom: 5 }
        },
        scales: {
          y: {
            ticks: {
              callback: (value, index, ticks) => {
                if (!this.stakeRewardsData?.length) return '';
                
                const lowestReward = Math.min(...this.stakeRewardsData.map(data => data.reward));
                const highestReward = Math.max(...this.stakeRewardsData.map(data => data.reward));
                if (index === 0) return lowestReward < 0.001 ? lowestReward.toFixedNoRounding(3) : lowestReward.toFixedNoRounding(3);
                if (index === ticks.length - 1) return highestReward < 0.001 ? highestReward.toFixedNoRounding(3) : highestReward.toFixedNoRounding(3);
                return '';
              }
            },
            border: {
              display: false,
            },
            grid: {
              display: false
            },
            beginAtZero: false // Set this to true if you want the Y-axis to start at 0
          },
          x: {
            ticks: {
              maxRotation: 0,
              minRotation: 0,
              callback: function(value, index, ticks) {
                // Show only first and last labels
                if (index === 0 || index === this.stakeRewardsData.length - 1) {
                  const label = this.utilService.datePipe.transform(this.stakeRewardsData[index]?.date, 'MMM yy');
                  console.log(label)
                  return label
                }
                return '';
              }.bind(this)
            },
            border: {
              display: false,
            },
            grid: {
              display: false
            }
          }
        },
        elements: {
          point: {
            radius: 0 // Hide the points on the line
          }
        },
        plugins: {
          legend: {
            display: false // Set this to true if you want to display the legend
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false,
            position: 'nearest',
            caretPadding: 10,
            caretSize: 5,
            cornerRadius: 4,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            titleColor: 'white',
            bodyColor: 'white',
            // borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            padding: 10,
            displayColors: true,
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  const value = context.parsed.y;
                  // For very small numbers (less than 0.001), show up to 6 decimal places
                  // For larger numbers, show up to 3 decimal places
                  const minimumFractionDigits = value < 0.001 ? 6 : 3;
                  const maximumFractionDigits = value < 0.001 ? 6 : 3;
                  label += new DecimalPipe('en-US').transform(value, 
                    `1.${minimumFractionDigits}-${maximumFractionDigits}`
                  ) + ' SOL';
                }
                return label;
              }
            }
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x'
            },
            zoom: {
              wheel: {
                enabled: true,
              },
              pinch: {
                enabled: true
              },
              mode: 'x',
            }
          }
        },
        events: this.isLoading ? [] : undefined,
      },
      plugins: [{
        id: 'centerText',
        afterDraw: (chart: any) => {
          const ctx = chart.ctx;
          const width = chart.width;
          const height = chart.height;
          
          ctx.save();
          if (this.stakeRewardsData.length === 0 && !this.isLoading) {
            // Clear the area where we'll draw the text
            ctx.clearRect(0, 0, width, height);
            
            // Set text properties
            ctx.font = '13px Inter';
            ctx.fillStyle = '#B84794';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw the text
            ctx.fillText('No accrued value', width / 2, height / 2);
          }
          ctx.restore();
        }
      }]
    };

    this.chartData = new Chart(ctx, config);
  }

  public shortAddress(address: string): string {
    return this.utilService.addrUtil(address).addrShort;
  }

  public onSelectRewardType(event: any) {
    console.log(event)
  }

  public async withdraw() {
    try {
      const res = await this._stakeService.withdrawExcessiveBalance(this.stakePosition)
      if(res) {
        this.stakePosition.inactive_stake = 0
      } 
    } catch (error) {
      console.error('Error withdrawing excessive balance', error);
    }
  }
 
  public async getProInsights() {
    try {
      const res: ProInsights  = await this._stakeService.getProInsights(this.stakePosition)
      this.stakePosition.proInsights = res
      
      this.stakeRewardsData = res.valueAccrued.map((stakeReward) => ({
        epoch: stakeReward.epoch,
        date: stakeReward.effective_time,
        reward: this.stakePosition.type === 'native' ? stakeReward.reward_amount : stakeReward.projectedValue
      }))
      this.totalRewards = this.stakeRewardsData.reduce((acc, curr) => acc + curr?.reward, 0) || 0

      console.log(this.totalRewards)
     if(this.stakePosition.type === 'native'){
      this._shs.getEpochTimestamp(this.stakePosition.activation_epoch).then((res) => {
        this.stakePosition.proInsights.startDate = new Date(res)
      })
     }
      return res
    } catch (error) {
      console.error('Error getting pro insights', error);
      return null
    }
    
  }
  ngOnDestroy(): void {
    this.chartData?.destroy();
  }
  
}
