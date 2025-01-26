import { Directive, inject, Input, OnInit, TemplateRef, ViewContainerRef } from "@angular/core";
import { FreemiumService } from "../layouts/freemium/freemium.service";

@Directive({
  selector: "[appIsPremiumAction]",
  standalone: true,
})
export class IsPremiumServiceDirective implements OnInit {
  @Input("appIsPremiumAction") action: string;
  private readonly templateRef = inject(TemplateRef);
  private readonly freemiumService = inject(FreemiumService);
  private readonly viewContainer = inject(ViewContainerRef);

  ngOnInit() {
    this.action = this.action.split("-modal")[0];

    console.log("Action", this.action)
    if (!this.freemiumService.isPremium() && this.freemiumService.isPremiumAction(this.action)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
