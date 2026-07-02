import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { Settings } from '@spendwise/shared';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { SwIcon } from '../../shared/ui/icon.component';
import { SwSegmentedTabs, type SegTab } from '../../shared/ui/segmented-tabs.component';

type ToggleKey = 'maskAccountNumbers' | 'biometricLock' | 'autoDeleteRawUploads' | 'usageAnalytics';

interface ToggleRow {
  key: ToggleKey;
  label: string;
  sub: string;
}

@Component({
  selector: 'sw-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SwIcon, SwSegmentedTabs],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly user = this.auth.user;
  readonly initial = computed(() => (this.user()?.name?.charAt(0) ?? 'S').toUpperCase());

  readonly settings = signal<Settings | null>(null);
  readonly exporting = signal(false);

  readonly themeTabs: SegTab[] = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'auto', label: 'Auto' },
  ];

  readonly toggleRows: ToggleRow[] = [
    { key: 'maskAccountNumbers', label: 'Mask account numbers', sub: 'Hide digits from imported statements' },
    { key: 'biometricLock', label: 'Biometric app lock', sub: 'Require Face ID / Touch ID to open' },
    { key: 'autoDeleteRawUploads', label: 'Auto-delete raw uploads', sub: 'Remove receipt and statement files after processing' },
    { key: 'usageAnalytics', label: 'Usage analytics', sub: 'Share anonymous usage data to improve SpendWise' },
  ];

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.settings.set(await this.api.settings());
    } catch {
      this.toast.show('Could not load settings');
    }
  }

  async setTheme(id: string): Promise<void> {
    const current = this.settings();
    if (!current || current.theme === id) return;
    const theme = id as Settings['theme'];
    this.settings.set({ ...current, theme });
    try {
      await this.api.updateSettings({ theme });
      this.toast.show('Preferences saved');
    } catch {
      this.settings.set(current);
      this.toast.show('Could not save preferences');
    }
  }

  async toggle(key: ToggleKey): Promise<void> {
    const current = this.settings();
    if (!current) return;
    const next = !current[key];
    this.settings.set({ ...current, [key]: next });
    try {
      await this.api.updateSettings({ [key]: next });
    } catch {
      this.settings.set(current);
      this.toast.show('Could not save setting');
    }
  }

  async exportData(): Promise<void> {
    if (this.exporting()) return;
    this.exporting.set(true);
    try {
      const blob = await this.api.exportReport({ range: 'this-year', format: 'csv', include: [] });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'spendwise-data.csv';
      link.click();
      URL.revokeObjectURL(url);
      this.toast.show('Export downloaded');
    } catch {
      this.toast.show('Export failed');
    } finally {
      this.exporting.set(false);
    }
  }

  deleteAccount(): void {
    this.toast.show('Account deletion is disabled in the demo');
  }
}
