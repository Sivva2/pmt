import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TaskService } from '../../../core/services/task.service';
import { Task, ProjectMember, Priority, Status } from '../../../core/models/models';

interface DialogData {
  projectId: number;
  members: ProjectMember[];
  task: Task | null;
}

@Component({
  selector: 'app-task-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatDatepickerModule, MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Modifier la tâche' : 'Nouvelle tâche' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-w">
          <mat-label>Nom</mat-label>
          <input matInput formControlName="name" maxlength="150" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-w">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Priorité</mat-label>
          <mat-select formControlName="priority">
            <mat-option value="LOW">Basse</mat-option>
            <mat-option value="MEDIUM">Moyenne</mat-option>
            <mat-option value="HIGH">Haute</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Statut</mat-label>
          <mat-select formControlName="status">
            <mat-option value="TODO">À faire</mat-option>
            <mat-option value="IN_PROGRESS">En cours</mat-option>
            <mat-option value="DONE">Terminé</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Date limite</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="dueDate" />
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Assigné à</mat-label>
          <mat-select formControlName="assigneeId">
            <mat-option [value]="null">— Non assigné —</mat-option>
            @for (m of data.members; track m.userId) {
              <mat-option [value]="m.userId">{{ m.username }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
      @if (error()) { <p class="error">{{ error() }}</p> }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (isEdit) {
        <button mat-button color="warn" (click)="delete()">
          <mat-icon>delete</mat-icon> Supprimer
        </button>
        <span style="flex:1"></span>
      }
      <button mat-button (click)="close()">Annuler</button>
      <button mat-flat-button color="primary" (click)="save()"
              [disabled]="form.invalid || loading()">
        {{ loading() ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .full-w { grid-column: 1 / -1; }
    .error { color: #d32f2f; margin: 0; }
  `]
})
export class TaskFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly taskService = inject(TaskService);
  private readonly dialogRef = inject(MatDialogRef<TaskFormDialog>);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly isEdit: boolean;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: [''],
    priority: ['MEDIUM' as Priority],
    status: ['TODO' as Status],
    dueDate: [null as Date | null],
    assigneeId: [null as number | null]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    this.isEdit = data.task !== null;
    if (data.task) {
      this.form.patchValue({
        name: data.task.name,
        description: data.task.description ?? '',
        priority: data.task.priority,
        status: data.task.status,
        dueDate: data.task.dueDate ? new Date(data.task.dueDate) : null,
        assigneeId: data.task.assigneeId
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name,
      description: raw.description || null,
      priority: raw.priority,
      status: raw.status,
      dueDate: raw.dueDate ? raw.dueDate.toISOString().split('T')[0] : null,
      assigneeId: raw.assigneeId
    };
    const obs = this.isEdit
      ? this.taskService.update(this.data.task!.id, payload)
      : this.taskService.create(this.data.projectId, payload);

    obs.subscribe({
      next: () => this.dialogRef.close(true),
      error: err => {
        this.error.set(err.error?.message ?? 'Erreur');
        this.loading.set(false);
      }
    });
  }

  delete(): void {
    if (!this.isEdit || !confirm('Supprimer cette tâche ?')) return;
    this.taskService.delete(this.data.task!.id).subscribe(() => this.dialogRef.close(true));
  }

  close(): void { this.dialogRef.close(false); }
}
