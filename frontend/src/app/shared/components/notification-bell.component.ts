import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/models';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule, DatePipe,
    MatButtonModule, MatIconModule, MatMenuModule, MatBadgeModule, MatListModule
  ],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="menu" (menuOpened)="load()"
            [matBadge]="notifService.unreadCount() || null"
            matBadgeColor="warn" matBadgeSize="small">
      <mat-icon>notifications</mat-icon>
    </button>
    <mat-menu #menu="matMenu" class="notif-menu">
      <div class="notif-header">Notifications</div>
      @if (items().length === 0) {
        <div class="empty">Aucune notification</div>
      } @else {
        @for (n of items(); track n.id) {
          <button mat-menu-item [class.unread]="!n.read" (click)="open(n)">
            <div class="notif-item">
              <div class="msg">{{ n.message }}</div>
              <div class="date">{{ n.createdAt | date:'dd/MM HH:mm' }}</div>
            </div>
          </button>
        }
      }
    </mat-menu>
  `,
  styles: [`
    .notif-header {
      font-weight: 600;
      padding: 8px 16px;
      border-bottom: 1px solid #eee;
    }
    .empty { padding: 16px; text-align: center; color: #888; min-width: 280px; }
    .notif-item { display: flex; flex-direction: column; line-height: 1.3; padding: 4px 0; }
    .msg { font-size: 14px; white-space: normal; }
    .date { font-size: 11px; color: #888; }
    .unread { background: #eff6ff; }
  `]
})
export class NotificationBellComponent implements OnInit {
  readonly notifService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly items = signal<Notification[]>([]);

  ngOnInit(): void {
    this.notifService.refreshUnreadCount().subscribe();
    // poll toutes les 30s
    setInterval(() => this.notifService.refreshUnreadCount().subscribe(), 30000);
  }

  load(): void {
    this.notifService.list().subscribe(list => this.items.set(list));
  }

  open(n: Notification): void {
    if (!n.read) {
      this.notifService.markAsRead(n.id).subscribe(() => {
        this.notifService.refreshUnreadCount().subscribe();
      });
    }
  }
}
