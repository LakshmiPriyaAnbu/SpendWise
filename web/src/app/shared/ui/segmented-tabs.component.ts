import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface SegTab {
  id: string;
  label: string;
}

@Component({
  selector: 'sw-segmented-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="track">
      @for (tab of tabs(); track tab.id) {
        <button
          type="button"
          [class.active]="tab.id === selected()"
          (click)="selectedChange.emit(tab.id)"
        >{{ tab.label }}</button>
      }
    </div>
  `,
  styles: [
    `
      .track {
        display: flex;
        gap: 3px;
        background: var(--sw-track);
        border-radius: 12px;
        padding: 3px;
      }
      button {
        border: none;
        background: transparent;
        border-radius: 9px;
        padding: 7px 14px;
        font-size: 13px;
        font-weight: 700;
        color: var(--sw-text-3);
        cursor: pointer;
      }
      button.active {
        background: #fff;
        color: var(--sw-text);
        box-shadow: 0 1px 4px rgba(18, 42, 35, 0.1);
      }
    `,
  ],
})
export class SwSegmentedTabs {
  tabs = input.required<SegTab[]>();
  selected = input.required<string>();
  selectedChange = output<string>();
}
