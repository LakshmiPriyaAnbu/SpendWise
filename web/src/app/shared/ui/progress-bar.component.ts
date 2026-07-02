import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'sw-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="track" [style.height.px]="height()">
      <div class="fill" [style.width.%]="clamped()" [style.background]="color()"></div>
    </div>
  `,
  styles: [
    `
      .track {
        border-radius: 99px;
        background: var(--sw-track);
        overflow: hidden;
        display: flex;
      }
      .fill {
        border-radius: 99px;
        height: 100%;
        transition: width 0.3s ease;
      }
    `,
  ],
})
export class SwProgressBar {
  /** 0-100 */
  pct = input.required<number>();
  color = input('linear-gradient(90deg,#18b184,#0e7c66)');
  height = input(8);

  clamped = computed(() => Math.max(0, Math.min(100, this.pct())));
}
