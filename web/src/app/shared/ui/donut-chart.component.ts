import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface DonutSegment {
  color: string;
  /** 0-100 */
  pct: number;
}

@Component({
  selector: 'sw-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" [attr.viewBox]="'0 0 ' + size() + ' ' + size()">
      <circle
        [attr.cx]="c()" [attr.cy]="c()" [attr.r]="r()"
        fill="none" [attr.stroke]="trackColor()" [attr.stroke-width]="stroke()"
      />
      @for (seg of arcs(); track $index) {
        <circle
          [attr.cx]="c()" [attr.cy]="c()" [attr.r]="r()"
          fill="none"
          [attr.stroke]="seg.color"
          [attr.stroke-width]="stroke()"
          stroke-linecap="butt"
          [attr.stroke-dasharray]="seg.dash"
          [attr.stroke-dashoffset]="seg.offset"
          [attr.transform]="'rotate(-90 ' + c() + ' ' + c() + ')'"
        />
      }
    </svg>
  `,
  styles: [':host{display:inline-block;line-height:0}'],
})
export class SwDonutChart {
  segments = input.required<DonutSegment[]>();
  size = input(150);
  stroke = input(20);
  trackColor = input('#eef2f0');

  c = computed(() => this.size() / 2);
  r = computed(() => (this.size() - this.stroke()) / 2);

  arcs = computed(() => {
    const circumference = 2 * Math.PI * this.r();
    let acc = 0;
    return this.segments()
      .filter((s) => s.pct > 0)
      .map((s) => {
        const len = (s.pct / 100) * circumference;
        const arc = { color: s.color, dash: `${len} ${circumference - len}`, offset: -acc };
        acc += len;
        return arc;
      });
  });
}
