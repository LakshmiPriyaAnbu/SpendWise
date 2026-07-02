import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';
import { SwIcon } from './icon.component';

@Component({
  selector: 'sw-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SwIcon],
  template: `
    @if (toast.message(); as msg) {
      <div class="toast">
        <span class="check"><sw-icon name="checkPlain" [size]="13" [strokeWidth]="2.5" /></span>
        {{ msg }}
      </div>
    }
  `,
  styles: [
    `
      .toast {
        position: fixed;
        left: 50%;
        bottom: 28px;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 10px;
        background: var(--sw-sidebar);
        color: #fff;
        font-size: 13.5px;
        font-weight: 600;
        padding: 12px 18px;
        border-radius: 99px;
        box-shadow: 0 14px 40px rgba(12, 42, 34, 0.35);
        animation: swtoast 0.25s ease;
        z-index: 1000;
        white-space: nowrap;
      }
      .check {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--sw-mint);
        color: var(--sw-sidebar);
        display: flex;
        align-items: center;
        justify-content: center;
        flex: none;
      }
    `,
  ],
})
export class SwToast {
  toast = inject(ToastService);
}
