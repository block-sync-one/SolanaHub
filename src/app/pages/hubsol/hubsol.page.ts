import { AsyncPipe, CurrencyPipe, DecimalPipe, NgClass, PercentPipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnInit, signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonLabel, IonCol, IonImg, IonGrid, IonRow, IonContent, IonText, IonSkeletonText, IonIcon } from "@ionic/angular/standalone";
import { Chart, ChartConfiguration, ChartItem } from 'chart.js';
import { addIcons } from 'ionicons';
import { libraryOutline, shieldCheckmarkOutline, waterOutline } from 'ionicons/icons';
import Lottie from 'lottie-web';
import { map, Observable, shareReplay, switchMap } from 'rxjs';

import { ApiService, JupStoreService, UtilService } from 'src/app/services';
import { TooltipModule } from 'src/app/shared/layouts/tooltip/tooltip.module';
interface LST_APY_HISTORY {
  epochAvg: number
  jupSOL: number
  mSOL: number
  jitoSOL: number
  hubSOL: number
  currentEpoch: number
  date: string
}
interface HubSOLAdoption {
  protocol: string
  total: number
  img?: string
}

@Component({
  selector: 'app-hubsol',
  templateUrl: './hubsol.page.html',
  styleUrls: ['./hubsol.page.scss'],
  standalone: true,
  imports: [
    IonIcon, 
    RouterLink,
    IonSkeletonText,
    DecimalPipe,
    NgClass,
    PercentPipe,
    IonText,
    IonContent,
    IonRow,
    IonImg,
    IonCol,
    IonLabel,
    IonButton,
    AsyncPipe,
    CurrencyPipe,
    TooltipModule
  ]
})
export class HubsolPage implements OnInit, AfterViewInit {
  @ViewChild('chartEl', { static: true }) chartEl: ElementRef;
  @ViewChild('animationEl', { static: true }) animationEl: ElementRef;
  chartData: Chart;
  protected api = inject(UtilService).serverlessAPI + '/api'
  public supportedPlatforms = [
    {
      protocol: 'phantom',
      img: 'assets/images/platforms/phantom.svg',
      type: 'wallet'
    },
    {
      protocol: 'meteora',
      img: 'assets/images/platforms/meteora.svg',
      type: 'AMM'
    },
    {
      protocol: 'jup',
      img: 'assets/images/platforms/jup.svg',
      type: 'aggregator'
    },
    {
      protocol: 'orca',
      img: 'assets/images/platforms/orca.svg',
      type: 'AMM'
    },
    {
      protocol: 'solayer',
      img: 'assets/images/platforms/solayer.svg',
      type: 'Restaking'
    },
    {
      protocol: 'solflare',
      img: 'assets/images/platforms/solflare.svg',
      type: 'wallet'
    },
    {
      protocol: 'kamino',
      img: 'assets/images/platforms/kamino.svg',
      type: 'AMM'
    },
    {
      protocol: 'raydium',
      img: 'assets/images/platforms/raydium.svg',
      type: 'AMM'
    },
    {
      protocol: 'save',
      img: 'assets/images/platforms/save.svg',
      type: 'lending'
    },
    {
      protocol: 'loopscale',
      img: 'assets/images/platforms/loopscale.svg',
      type: 'AMM'
    },
    {
      protocol: 'mango',
      img: 'assets/images/platforms/mango.svg',
      type: 'DEX'
    },

    {
      protocol: 'texture',
      img: 'assets/images/platforms/texture.svg',
      type: 'DEX'
    },
    // {
    //   img: 'assets/images/platforms/jup.svg',
    //   type: 'aggregator'
    // },
    // {
    //   img: 'assets/images/platforms/orca.svg',
    //   type: 'DEX'
    // }
  ]
  constructor(
    private _apiService: ApiService,
    private _jupService: JupStoreService
  ) { 
    addIcons({shieldCheckmarkOutline,waterOutline,libraryOutline});
  }
  ngOnInit() {
    this.startAnim()
    this.getMetrics()
  }
  ngAfterViewInit(): void {
    this.lstApyChart()
  }
  startAnim() {
    Lottie.loadAnimation({
      container: this.animationEl.nativeElement, // the dom element that will contain the animation
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: 'assets/hubSOL-anim.json' // the path to the animation json
    });
  }
  public metrics = signal(null)
  public async getMetrics() {
    const metrics = await (await fetch(`${this.api}/hubSOL/get-metrics`)).json()
    this.metrics.set(metrics)

  }

  private async _getLstApyHistory(): Promise<LST_APY_HISTORY[]> {
    try {
      const lstApyHistory = await (await fetch(`${this.api}/lst-apy`)).json()
      return lstApyHistory
    } catch (error) {
      console.log(error);
      return [] as any
    }
  }
  async lstApyChart() {
    const lstApyHistory = await this._getLstApyHistory()
    this.chartData ? this.chartData.destroy() : null
    const ctx = this.chartEl.nativeElement


    var hubSOLgradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    hubSOLgradient.addColorStop(0, 'rgba(203,98,175,0.1)');

    var jitoSOLgradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    jitoSOLgradient.addColorStop(0, 'rgba(185, 107, 253, 0.1)');

    var mSOLgradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    mSOLgradient.addColorStop(0, 'rgba(48, 141, 138, 0.1)');

    var jupSOLgradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    jupSOLgradient.addColorStop(0, 'rgba(28, 40 ,54, 0.1)');


    const config2: ChartConfiguration = {
      type: 'line',
      data: {
        labels: lstApyHistory.map(item => new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })), // X-axis labels
        datasets: [
          {
            label: 'hubSOL',
            data: lstApyHistory.map(item => item.hubSOL),
            backgroundColor: hubSOLgradient,
            borderColor: '#B84794',
            borderWidth: 2,
            tension: 0.5, // This will make the line chart smoother
            fill: true,
          },
          {
            label: 'jupSOL',
            data: lstApyHistory.map(item => item.jupSOL),
            backgroundColor: jupSOLgradient,
            borderColor: '#1c2836',
            borderWidth: 2,
            tension: 0.5,
            fill: true,
          },
          {
            label: 'mSOL',
            data: lstApyHistory.map(item => item.mSOL),
            backgroundColor: mSOLgradient,
            borderColor: '#308d8b',
            borderWidth: 2,
            tension: 0.5,
            fill: true,
          },
          {
            label: 'jitoSOL',
            data: lstApyHistory.map(item => item.jitoSOL),
            backgroundColor: jitoSOLgradient,
            borderColor: '#b96bfd',
            borderWidth: 2,
            tension: 0.5,
            fill: true,
          },
        ]
      },
      options: {

        responsive: true,
        maintainAspectRatio: false,
        layout: {

          padding: { left: 5, right: 5, top: 10, bottom: 5 }
        },
        scales: {
          y: {
            ticks: {
              display: true,
              callback: (value, index, values) => {
                return (Number(value) * 100).toFixedNoRounding(2) + '%'
              }
            },
            border: {
              display: false,
            },
            grid: {

              display: true
            },
            beginAtZero: false // Set this to true if you want the Y-axis to start at 0
          },
          x: {
            display: true,
            ticks: {
              align: 'inner',
              callback: function (val: any, index, dates) {

                return this.getLabelForValue(val);
              },
            },
            border: {
              display: false,
            },
            grid: {
              display: false,

            },
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
                  label += new DecimalPipe('en-US').transform(context.parsed.y * 100, '1.2-2') + '%';
                }
                return label;
              }
            }
          }
        }
      }
    }

    this.chartData = new Chart(ctx, config2)

  }
  public adoptionTVL = this._apiService.get(this.api + '/hubSOL/get-onchain-tvl').pipe(shareReplay())

}
