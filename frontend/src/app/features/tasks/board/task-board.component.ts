import { Component, Input, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { Task, Status, Priority, ProjectMember } from '../../../core/models/models';
import { TaskFormDialog } from '../form/task-form.dialog';
import { TaskHistoryDialog } from '../history/task-history.dialog';

interface Column {
  id: Status;
  label: string;
  tasks: Task[];
}

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [
    CommonModule, DatePipe, DragDropModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatChipsModule
  ],
  template: `
    <div class="board-header">
      <button mat-flat-button color="primary" (click)="openCreate()">
        <mat-icon>add</mat-icon> Nouvelle tâche
      </button>
    </div>

    <div class="board" cdkDropListGroup>
      @for (col of columns(); track col.id) {
        <div class="column">
          <div class="column-header">
            <span>{{ col.label }}</span>
            <span class="count">{{ col.tasks.length }}</span>
          </div>
          <div
            class="column-body"
            cdkDropList
            [cdkDropListData]="col.tasks"
            [id]="col.id"
            (cdkDropListDropped)="onDrop($event)"
          >
            @for (task of col.tasks; track task.id) {
              <div class="task-card" cdkDrag (click)="openEdit(task)">
                <div class="task-title">{{ task.name }}</div>
                @if (task.description) {
                  <p class="task-desc">{{ task.description }}</p>
                }
                <div class="task-footer">
                  <span class="priority" [class]="'priority-' + task.priority.toLowerCase()">
                    {{ priorityLabel(task.priority) }}
                  </span>
                  @if (task.dueDate) {
                    <span class="due">
                      <mat-icon>event</mat-icon>
                      {{ task.dueDate | date:'dd/MM' }}
                    </span>
                  }
                  @if (task.assigneeUsername) {
                    <span class="assignee">{{ '@' + task.assigneeUsername }}</span>
                  }
                  <button mat-icon-button (click)="openHistory(task, $event)"
                          matTooltip="Historique">
                    <mat-icon>history</mat-icon>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .board-header { padding: 16px 0; }
    .board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      padding-bottom: 24px;
    }
    @media (max-width: 800px) {
      .board { grid-template-columns: 1fr; }
    }
    .column {
      background: #eef0f3;
      border-radius: 12px;
      padding: 12px;
      min-height: 400px;
    }
    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      margin-bottom: 12px;
      color: #333;
    }
    .count {
      background: white;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
    }
    .column-body { min-height: 300px; }
    .task-card {
      background: white;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
      cursor: grab;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      transition: box-shadow .15s;
    }
    .task-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
    .task-card:active { cursor: grabbing; }
    .task-title { font-weight: 500; margin-bottom: 4px; }
    .task-desc {
      font-size: 13px;
      color: #666;
      margin: 4px 0 8px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .task-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 12px;
    }
    .task-footer .mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .priority {
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      font-size: 11px;
    }
    .priority-low    { background: #d1fae5; color: #065f46; }
    .priority-medium { background: #fef3c7; color: #92400e; }
    .priority-high   { background: #fee2e2; color: #991b1b; }
    .due    { display: inline-flex; align-items: center; gap: 2px; color: #555; }
    .assignee { color: #0369a1; margin-left: auto; }
    .cdk-drag-preview {
      box-shadow: 0 12px 24px rgba(0,0,0,0.2);
      border-radius: 8px;
    }
    .cdk-drag-placeholder { opacity: 0.3; }
  `]
})
export class TaskBoardComponent implements OnInit {
  @Input({ required: true }) projectId!: number;

  private readonly taskService = inject(TaskService);
  private readonly projectService = inject(ProjectService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private readonly tasks = signal<Task[]>([]);
  readonly members = signal<ProjectMember[]>([]);

  readonly columns = computed<Column[]>(() => {
    const t = this.tasks();
    return [
      { id: 'TODO',        label: 'À faire',    tasks: t.filter(x => x.status === 'TODO') },
      { id: 'IN_PROGRESS', label: 'En cours',   tasks: t.filter(x => x.status === 'IN_PROGRESS') },
      { id: 'DONE',        label: 'Terminé',    tasks: t.filter(x => x.status === 'DONE') }
    ];
  });

  ngOnInit(): void {
    this.loadTasks();
    this.projectService.listMembers(this.projectId).subscribe(m => this.members.set(m));
  }

  loadTasks(): void {
    this.taskService.listByProject(this.projectId).subscribe(t => this.tasks.set(t));
  }

  onDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }
    const task = event.previousContainer.data[event.previousIndex];
    const newStatus = event.container.id as Status;
    transferArrayItem(event.previousContainer.data, event.container.data,
                       event.previousIndex, event.currentIndex);
    this.taskService.update(task.id, { name: task.name, status: newStatus }).subscribe({
      next: () => this.loadTasks(),
      error: () => {
        this.snackBar.open('Erreur lors du déplacement', 'OK', { duration: 2500 });
        this.loadTasks();
      }
    });
  }

  openCreate(): void {
    const ref = this.dialog.open(TaskFormDialog, {
      width: '520px',
      data: { projectId: this.projectId, members: this.members(), task: null }
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.loadTasks(); });
  }

  openEdit(task: Task): void {
    const ref = this.dialog.open(TaskFormDialog, {
      width: '520px',
      data: { projectId: this.projectId, members: this.members(), task }
    });
    ref.afterClosed().subscribe(saved => { if (saved) this.loadTasks(); });
  }

  openHistory(task: Task, ev: Event): void {
    ev.stopPropagation();
    this.dialog.open(TaskHistoryDialog, {
      width: '600px',
      data: { task }
    });
  }

  priorityLabel(p: Priority): string {
    return { LOW: 'Basse', MEDIUM: 'Moyenne', HIGH: 'Haute' }[p];
  }
}
