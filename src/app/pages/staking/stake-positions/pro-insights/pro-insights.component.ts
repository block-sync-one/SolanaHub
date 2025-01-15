import { AfterViewInit, Component, ElementRef, inject, Input, OnInit, ViewChild } from '@angular/core';
import { IonLabel, IonSegmentButton, IonSegment, IonSkeletonText, IonText, IonIcon, IonButton } from "@ionic/angular/standalone";
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { StakeAccount, StakeService } from '../../stake.service';
import { LiquidStakeToken } from '../../stake.service';
import { Chart, ChartConfiguration, ChartItem } from 'chart.js';
import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import zoomPlugin from 'chartjs-plugin-zoom';
import { SolanaHelpersService, UtilService } from 'src/app/services';
import { CopyTextDirective } from 'src/app/shared/directives/copy-text.directive';

Chart.register(zoomPlugin);

@Component({
  selector: 'pro-insights',
  templateUrl: './pro-insights.component.html',
  styleUrls: ['./pro-insights.component.scss'],
  standalone: true,
  imports: [AsyncPipe,IonButton, IonIcon, CopyTextDirective, IonText,DatePipe, IonSkeletonText, IonSegment, IonSegmentButton, IonLabel, ChipComponent]
})

export class ProInsightsComponent implements AfterViewInit {
  private _utilService = inject(UtilService);
  private _stakeService = inject(StakeService);
  private _shs = inject(SolanaHelpersService)
  @Input() stakePosition: StakeAccount | LiquidStakeToken | any
  @ViewChild('chartEl', { static: true }) chartEl: ElementRef;
  chartData: Chart;
  public stakeRewardsData = [
    {
      epoch: 550,
      reward: 1
    },
    {
      epoch: 551,
      reward: 7
    },
    {
      epoch: 552,
      reward: 5
    },
    {
      epoch: 553,
      reward: 3
    },
    {
      epoch: 554,
      reward: 1
    },
    {
      epoch: 555,
      reward: 8
    },
    {
      epoch: 556,
      reward: 3
    },
    {
      epoch: 557,
      reward: 2
    },
    {
      epoch: 558,
      reward: 6
    },
    {
      epoch: 559,
      reward: 0.5
    },
    {
      epoch: 560,
      reward: 4.2
    },
    {
      epoch: 561,
      reward: 2.8
    },
    {
      epoch: 562,
      reward: 5.1
    },
    {
      epoch: 607,
      reward: 3.7
    },
    {
      epoch: 608,
      reward: 4.9
    },
    {
      epoch: 609,
      reward: 2.3
    }
  ]
  selectedPeriod = '1d';
  totalRewards = this.stakeRewardsData.reduce((acc, curr) => acc + curr.reward, 0);
  startDate = '2024-01-01';
  startEpoch = 550;
  public epochDate$;
  constructor() { }

  ngAfterViewInit() {
    this.initChart();
    this.epochDate$ = this.getEpochUnixTime(this.stakePosition.activation_epoch)
  }

  private initChart() {
    this.chartData ? this.chartData.destroy() : null
    const ctx = this.chartEl.nativeElement

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.stakeRewardsData.map(data => `Epoch ${data.epoch}`),
        datasets: [{
          label: 'Rewards',
          data: this.stakeRewardsData.map(data => data.reward),
          backgroundColor: 'rgba(184,71,148)',
          borderWidth: 0
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
                const lowestReward = Math.min(...this.stakeRewardsData.map(data => data.reward));
                const highestReward = Math.max(...this.stakeRewardsData.map(data => data.reward));
                if (index === 0) return lowestReward;
                if (index === ticks.length - 1) return highestReward;
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
            min: this.stakeRewardsData.length - 5,
            max: this.stakeRewardsData.length - 1,
            ticks: {
              callback: (value, index, ticks) => index === ticks.length - 1 || index === 0 ? this.stakeRewardsData[index].epoch : ''
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
                  label += new DecimalPipe('en-US').transform(context.parsed.y) + ' SOL';
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
        }
      }
    };

    this.chartData = new Chart(ctx, config);
  }

  public shortAddress(address: string): string {
    return this._utilService.addrUtil(address).addrShort;
  }

  public async withdraw() {
    const res = await this._stakeService.withdrawExcessiveBalance(this.stakePosition)
    if(res) {
      this.stakePosition.inactive_stake = 0
    } 
  }
  public async getEpochUnixTime(startEpoch: any) {
    console.log('startEpoch', startEpoch);
    

    const slotsPerEpoch = 432000
    const blockTime = await this._shs.connection.getBlockTime(startEpoch * slotsPerEpoch)
    
    const date = new Date(blockTime * 1000)
    console.log('date', date);
    return date
  }
  public getProInsights() {
    this._stakeService.getProInsights(this.stakePosition.address)
  }
}
