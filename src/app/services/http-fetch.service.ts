import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CaptchaService } from './captcha.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpFetchService {
  private baseUrl = environment.apiUrl; // Add your API base URL here if needed

  constructor(private _captchaService: CaptchaService) { }
  public captchaToken = this._captchaService.captchaToken;
  private sharedHeaders = {
    'Content-Type': 'application/json',
    'x-captcha-token': this.captchaToken,
    'x-bypass': '1234'
  }
  // Generic request method to handle all HTTP calls
  private async request<T>(url: string, options: RequestInit): Promise<T> {
    try {
      const response = await fetch(this.baseUrl + url, {
        ...options,
        headers: this.sharedHeaders
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  public async get<T>(url: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'GET',
    });
  }

  public async post<T>(url: string, body: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async put<T>(url: string, body: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  public async delete<T>(url: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }

  public async patch<T>(url: string, body: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }
}
