import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { ICON_PATHS } from './icon-paths';

@Component({
  selector: 'sw-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      [innerHTML]="markup()"
    ></svg>
  `,
  styles: [':host{display:inline-flex;align-items:center;justify-content:center;line-height:0}'],
})
export class SwIcon {
  private sanitizer = inject(DomSanitizer);

  name = input.required<string>();
  size = input(20);
  strokeWidth = input(1.75);

  markup = computed<SafeHtml>(() =>
    // static registry content, not user input
    this.sanitizer.bypassSecurityTrustHtml(ICON_PATHS[this.name()] ?? ICON_PATHS['other']),
  );
}
