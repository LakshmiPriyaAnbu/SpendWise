import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SwIcon } from './icon.component';

@Component({
  selector: 'sw-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SwIcon],
  template: `
    <div class="empty">
      <div class="tile"><sw-icon [name]="icon()" [size]="24" /></div>
      <div class="title">{{ title() }}</div>
      <div class="hint">{{ hint() }}</div>
    </div>
  `,
  styles: [
    `
      .empty {
        padding: 56px 24px;
        text-align: center;
        color: var(--sw-text-7);
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .tile {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        background: #f2f5f3;
        color: #b6c2bc;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 14px;
      }
      .title {
        font-size: 14px;
        font-weight: 700;
        color: var(--sw-text-3);
      }
      .hint {
        font-size: 13px;
        margin-top: 4px;
        max-width: 260px;
      }
    `,
  ],
})
export class SwEmptyState {
  icon = input('search');
  title = input.required<string>();
  hint = input('');
}
