import { NgIf, PercentPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IonProgressBar, IonText } from "@ionic/angular/standalone";
import { catchError, take } from 'rxjs';
import { SolanaHelpersService } from 'src/app/services';

@Component({
  selector: 'epoch-progress-bar',
  template: `
    <ion-progress-bar 
      [value]="progress" 
      [class.animate]="isLoading">
    </ion-progress-bar>
    <ion-text>
      <ng-container *ngIf="!error; else errorTpl">
        Progress: {{progress | percent}} • Time remaining: ~{{ETA || 'Calculating...'}}
      </ng-container>
      <ng-template #errorTpl>
        <span class="error">Failed to load epoch data</span>
      </ng-template>
    </ion-text>
  `,
  styleUrls: ['./epoch-progress-bar.component.scss'],
  standalone: true,
  imports: [IonProgressBar, IonText, PercentPipe, NgIf]
})
export class EpochProgressBarComponent implements OnInit {
  progress = 0;
  ETA = '';
  isLoading = true;
  error: boolean = false;

  constructor(private _shs: SolanaHelpersService) { }

  ngOnInit(): void {
    this.loadEpochInfo();
  }

  private loadEpochInfo(): void {
    this._shs.getEpochInfo()
      .pipe(
        take(1),
        catchError((err) => {
          this.error = true;
          this.isLoading = false;
          console.error('Failed to load epoch info:', err);
          return [];
        })
      )
      .subscribe({
        next: (data) => {
          this.progress = data.timepassInPercentgae;
          this.ETA = data.ETA;
          this.isLoading = false;
        }
      });
  }
}
