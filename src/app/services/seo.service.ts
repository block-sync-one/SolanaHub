import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { SEO, SeoData } from '../shared/constants';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private renderer: Renderer2;

  constructor(
    private meta: Meta,
    private title: Title,
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  setSEO(page: string): void {
    const seoData = { ...SEO['default'], ...SEO[page] };

    // Set Title
    this.title.setTitle(seoData.TITLE);

    // Clear previous tags
    this.clearPreviousSeo();

    // Meta Tags
    this.meta.addTags([
      { name: 'description', content: seoData.DESCRIPTION },
      { name: 'keywords', content: seoData.KEYWORDS },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:title', content: seoData.TITLE },
      { property: 'og:description', content: seoData.DESCRIPTION },
      { property: 'og:image', content: seoData.IMAGE },
      { property: 'og:url', content: seoData.URL },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: seoData.TITLE },
      { name: 'twitter:description', content: seoData.DESCRIPTION },
      { name: 'twitter:image', content: seoData.IMAGE }
    ]);

    // Canonical URL
    if (seoData.CANONICAL) {
      const link: HTMLLinkElement = this.renderer.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', seoData.CANONICAL);
      this.renderer.appendChild(document.head, link);
    }

    // Structured Data
    this.injectStructuredData(seoData.SCHEMA);

    // Inject Static HTML (h1, p) for SEO
    this.injectSeoStaticContent(seoData.H1, seoData.P);
  }

  private clearPreviousSeo(): void {
    const selectors = [
      'meta[name="description"]',
      'meta[name="keywords"]',
      'meta[property^="og:"]',
      'meta[name^="twitter:"]',
      'link[rel="canonical"]',
      'script[type="application/ld+json"]',
      'div#seo-content'
    ];

    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(tag => tag.remove());
    });
  }

  private injectStructuredData(schema: Record<string, any>): void {
    const script = this.renderer.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    this.renderer.appendChild(document.head, script);
  }

  private injectSeoStaticContent(h1: string, p: string): void {
    const seoDiv = this.renderer.createElement('div');
    seoDiv.id = 'seo-content';
    seoDiv.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;opacity:0;';

    const h1El = this.renderer.createElement('h1');
    const pEl = this.renderer.createElement('p');

    h1El.textContent = h1;
    pEl.textContent = p;

    this.renderer.appendChild(seoDiv, h1El);
    this.renderer.appendChild(seoDiv, pEl);
    this.renderer.appendChild(document.body, seoDiv);
  }
}
