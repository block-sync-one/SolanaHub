import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CaptchaService } from 'src/app/services/captcha.service';
import { environment } from 'src/environments/environment';
declare global {

  interface turnstile { any }
}
@Component({
  selector: 'turnstile-captcha',
  template: `<div class="cf-turnstile"  #turnstileElement></div>`,
  standalone: true,
  styles: [
    `
      :host {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
      }
    `,
  ],
})
export class TurnstileCaptchaComponent implements OnInit {
  private readonly _apiUrl = environment.apiUrl;
  @ViewChild('turnstileElement') turnstileElement!: ElementRef;
  turnStileKey = environment.turnStile;
  constructor(private captchaService: CaptchaService) { }
  _turnstileCb() {
    (window as any).turnstile.render(this.turnstileElement.nativeElement, {
      sitekey: this.turnStileKey,
      callback: (token: string) => {
        console.log(`Challenge Success ${token}`);
        this.captchaService.captchaToken = token;
        this.submitForm(token);
      },
    });
  }
  async ngOnInit(): Promise<void> {
    try {
      if (this.captchaService.isCaptchaVerified()) {
        return;
      }
      await this.initTurnstile();
      this._turnstileCb();
    } catch (error) {
      console.error('Failed to load Turnstile:', error);
    }
  }
  private initTurnstile(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (error) => reject(error);
      document.head.appendChild(script);
    });
  }
  async submitForm(turnstileResponse: string) {
    if (turnstileResponse) {
      try {
        const response = await fetch(`${this._apiUrl}/api/verify-turnstile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-captcha-token': this.captchaService.captchaToken
          }
        });
        const data = await response.json();
        console.log(data);
        if (data.message === 'success') {
          this.captchaService.setCaptchaVerified(true);
          return true;
        } else {
          console.log('CAPTCHA verification failed. Please try again.');
          return false;
        }
      } catch (error) {
        console.error('Error verifying CAPTCHA:', error);
        console.log('Error occurred during CAPTCHA verification.');
      }
    } else {
      console.log('Please complete the CAPTCHA');
      return false;
    }
    return false;
  }
}
