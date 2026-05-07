import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from './core/services/auth.service';
import { NotificationBellComponent } from './shared/components/notification-bell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterOutlet,
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule,
    NotificationBellComponent
  ],
  template: `
    @if (auth.isAuthenticated()) {
      <mat-toolbar color="primary" class="topbar">
        <a routerLink="/projects" class="brand">
          <mat-icon>settings</mat-icon> PMT
        </a>
        <span class="spacer"></span>
        <app-notification-bell></app-notification-bell>
        <button mat-button [matMenuTriggerFor]="userMenu">
          <mat-icon>account_circle</mat-icon>
          {{ auth.currentUser()?.username }}
        </button>
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item disabled>
            <mat-icon>email</mat-icon> {{ auth.currentUser()?.email }}
          </button>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon> Déconnexion
          </button>
        </mat-menu>
      </mat-toolbar>
    }
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .topbar { position: sticky; top: 0; z-index: 10; }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: white;
      text-decoration: none;
      font-weight: 600;
      font-size: 18px;
    }
    .spacer { flex: 1; }
    main { min-height: calc(100vh - 64px); }
  `]
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
