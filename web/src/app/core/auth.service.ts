import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_ROUTES, type AuthResponse, type LoginRequest, type RegisterRequest, type User } from '@spendwise/shared';

const TOKEN_KEY = 'sw_token';
const USER_KEY = 'sw_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private userSig = signal<User | null>(readUser());
  readonly user = this.userSig.asReadonly();
  readonly isLoggedIn = computed(() => this.userSig() !== null);

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  async login(body: LoginRequest): Promise<void> {
    this.store(await firstValueFrom(this.http.post<AuthResponse>(API_ROUTES.auth.login, body)));
  }

  async register(body: RegisterRequest): Promise<void> {
    this.store(await firstValueFrom(this.http.post<AuthResponse>(API_ROUTES.auth.register, body)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.userSig.set(null);
    this.router.navigateByUrl('/login');
  }

  private store(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    this.userSig.set(res.user);
  }
}

function readUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
