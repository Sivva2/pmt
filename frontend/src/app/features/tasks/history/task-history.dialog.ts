import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { TaskService } from '../../../core/services/task.service';
import { Task, TaskHistoryEntry } from '../../../core/models/models';

interface DialogData { task: Task; }

@Component({
  selector: 'app-task-history-dialog',
  standalone: true,
  imports: [
    CommonModule, DatePipe, MatDialogModule,
    MatButtonModule, MatIconModule, MatListModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>history</mat-icon> Historique — {{ data.task.name }}
    </h2>
    <mat-dialog-content>
      @if (loading()) {
        <p>Chargement…</p>
      } @else if (entries().length === 0) {
        <p class="empty">Aucune modification enregistrée.</p>
      } @else {
        <div class="timeline">
          @for (e of entries(); track e.id) {
            <div class="entry">
              <div class="dot"></div>
              <div class="entry-body">
                <div class="entry-header">
                  <strong>{{ e.username }}</strong>
                  <span class="when">{{ e.changedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="entry-content">
                  a modifié <strong>{{ fieldLabel(e.fieldChanged) }}</strong> :
                  @if (e.oldValue) {
                    <span class="old">{{ e.oldValue }}</span>
                  } @else {
                    <span class="old">(vide)</span>
                  }
                  <mat-icon>arrow_forward</mat-icon>
                  <span class="new">{{ e.newValue || '(vide)' }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .empty { color: #888; text-align: center; padding: 16px; }
    .timeline { padding-left: 8px; }
    .entry {
      position: relative;
      padding: 12px 0 12px 24px;
      border-left: 2px solid #e5e7eb;
    }
    .dot {
      position: absolute;
      left: -7px;
      top: 16px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #3b82f6;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin-bottom: 4px;
    }
    .when { color: #888; }
    .entry-content {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      font-size: 14px;
    }
    .old { background: #fee2e2; padding: 2px 6px; border-radius: 4px; }
    .new { background: #d1fae5; padding: 2px 6px; border-radius: 4px; }
    .entry-content .mat-icon { font-size: 16px; width: 16px; height: 16px; }
  `]
})
export class TaskHistoryDialog implements OnInit {
  private readonly taskService = inject(TaskService);
  readonly dialogRef = inject(MatDialogRef<TaskHistoryDialog>);

  readonly entries = signal<TaskHistoryEntry[]>([]);
  readonly loading = signal(true);

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  ngOnInit(): void {
    this.taskService.history(this.data.task.id).subscribe(list => {
      this.entries.set(list);
      this.loading.set(false);
    });
  }

  fieldLabel(f: string): string {
    const map: Record<string, string> = {
      name: 'nom',
      description: 'description',
      priority: 'priorité',
      status: 'statut',
      dueDate: 'date limite',
      assignee: 'assigné'
    };
    return map[f] || f;
  }
}
