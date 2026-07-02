import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Category } from '@spendwise/shared';

@Component({
  selector: 'sw-category-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="chip" [style.background]="category().bg" [style.color]="category().color">
      <span class="dot" [style.background]="category().color"></span>{{ category().name }}
    </span>
  `,
  styles: [
    `
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 99px;
        font-size: 11.5px;
        font-weight: 700;
        white-space: nowrap;
      }
      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }
    `,
  ],
})
export class SwCategoryChip {
  category = input.required<Category>();
}
