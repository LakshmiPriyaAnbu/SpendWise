import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { Settings } from '@spendwise/shared';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { COPY } from '../../core/copy';
import { downloadBlob } from '../../core/download.util';
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

  protected readonly copy = COPY;

  readonly user = this.auth.user;
  readonly initial = computed(() => (this.user()?.name?.charAt(0) ?? 'S').toUpperCase());

  readonly settings = signal<Settings | null>(null);
  readonly exporting = signal(false);

  readonly themeTabs: SegTab[] = [
    { id: 'light', label: COPY.settings.themeTabs.light },
    { id: 'dark', label: COPY.settings.themeTabs.dark },
    { id: 'auto', label: COPY.settings.themeTabs.auto },
  ];

  readonly toggleRows: ToggleRow[] = [
    { key: 'maskAccountNumbers', ...COPY.settings.toggles.maskAccountNumbers },
    { key: 'biometricLock', ...COPY.settings.toggles.biometricLock },
    { key: 'autoDeleteRawUploads', ...COPY.settings.toggles.autoDeleteRawUploads },
    { key: 'usageAnalytics', ...COPY.settings.toggles.usageAnalytics },
  ];

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      this.settings.set(await this.api.settings());
    } catch {
      this.toast.show(COPY.settings.toasts.couldNotLoad);
    }
  }

  async setTheme(id: string): Promise<void> {
    const current = this.settings();
    if (!current || current.theme === id) return;
    const theme = id as Settings['theme'];
    this.settings.set({ ...current, theme });
    try {
      await this.api.updateSettings({ theme });
      this.toast.show(COPY.settings.toasts.saved);
    } catch {
      this.settings.set(current);
      this.toast.show(COPY.settings.toasts.couldNotSavePrefs);
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
      this.toast.show(COPY.settings.toasts.couldNotSaveSetting);
    }
  }

  async exportData(): Promise<void> {
    if (this.exporting()) return;
    this.exporting.set(true);
    try {
      const blob = await this.api.exportReport({ range: 'this-year', format: 'csv', include: [] });
      downloadBlob(blob, COPY.settings.exportFilename);
      this.toast.show(COPY.settings.toasts.exportDownloaded);
    } catch {
      this.toast.show(COPY.settings.toasts.exportFailed);
    } finally {
      this.exporting.set(false);
    }
  }

  deleteAccount(): void {
    this.toast.show(COPY.settings.toasts.deleteDisabled);
  }
}
