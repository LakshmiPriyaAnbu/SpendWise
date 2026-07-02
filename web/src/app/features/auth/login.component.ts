import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { SwIcon } from '../../shared/ui/icon.component';

@Component({
  selector: 'sw-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SwIcon],
  template: `
    <div class="page">
      <div class="card sw-rise">
        <div class="logo">
          <div class="logo-tile"><sw-icon name="piggy" [size]="20" [strokeWidth]="2" /></div>
          <div class="logo-word">Spend<span>Wise</span></div>
        </div>
        <h1>Welcome back</h1>
        <p class="sub">Sign in to keep your spending wise.</p>
        <form (submit)="submit($event)">
          <label class="sw-label" for="login-email">Email</label>
          <input
            id="login-email"
            class="sw-input field"
            type="email"
            autocomplete="email"
            [value]="email()"
            (input)="email.set($any($event.target).value)"
          />
          <label class="sw-label" for="login-password">Password</label>
          <input
            id="login-password"
            class="sw-input field"
            type="password"
            autocomplete="current-password"
            [value]="password()"
            (input)="password.set($any($event.target).value)"
          />
          @if (error()) {
            <div class="error">{{ error() }}</div>
          }
          <button class="sw-btn-primary submit" type="submit" [disabled]="pending()">
            {{ pending() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
        <div class="alt">New here? <a routerLink="/register">Create an account</a></div>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
          radial-gradient(900px 480px at 50% -10%, rgba(24, 177, 132, 0.14), transparent 65%),
          var(--sw-bg);
      }
      .card {
        width: 100%;
        max-width: 420px;
        background: var(--sw-card);
        border: 1px solid var(--sw-border);
        border-radius: 20px;
        padding: 34px 30px 30px;
      }
      .logo {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 22px;
      }
      .logo-tile {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: var(--sw-gradient);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        flex: none;
      }
      .logo-word {
        font-family: var(--sw-font-num);
        font-weight: 700;
        font-size: 19px;
        letter-spacing: -0.3px;
        color: var(--sw-text);
        span {
          color: var(--sw-primary);
        }
      }
      h1 {
        font-family: var(--sw-font-num);
        font-size: 22px;
        font-weight: 700;
        letter-spacing: -0.3px;
      }
      .sub {
        font-size: 13.5px;
        color: var(--sw-text-6);
        margin: 5px 0 22px;
      }
      .field {
        margin-bottom: 16px;
      }
      .error {
        color: var(--sw-danger);
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 12px;
      }
      .submit {
        width: 100%;
        height: 48px;
        font-size: 14.5px;
        margin-top: 4px;
      }
      .alt {
        margin-top: 18px;
        text-align: center;
        font-size: 13px;
        color: var(--sw-text-5);
        a {
          color: var(--sw-primary);
          font-weight: 700;
          text-decoration: none;
        }
      }
    `,
  ],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  // demo convenience prefill
  readonly email = signal('lakshmi@email.com');
  readonly password = signal('spendwise123');
  readonly error = signal<string | null>(null);
  readonly pending = signal(false);

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.pending()) return;
    this.error.set(null);
    this.pending.set(true);
    try {
      await this.auth.login({ email: this.email().trim(), password: this.password() });
      await this.router.navigateByUrl('/');
    } catch (e) {
      const err = e as HttpErrorResponse;
      this.error.set(err.error?.error?.message ?? 'Could not sign in. Please try again.');
    } finally {
      this.pending.set(false);
    }
  }
}
