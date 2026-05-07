import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  template: `
    <div class="container" style="max-width:640px;">
      <div class="page-header">
        <h1>Nouveau projet</h1>
        <a mat-button routerLink="/projects">
          <mat-icon>arrow_back</mat-icon> Retour
        </a>
      </div>
      <mat-card>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-w">
              <mat-label>Nom du projet</mat-label>
              <input matInput formControlName="name" maxlength="100" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-w">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="4"></textarea>
            </mat-form-field>
            @if (error()) { <p class="error">{{ error() }}</p> }
            <div class="actions">
              <a mat-button routerLink="/projects">Annuler</a>
              <button mat-flat-button color="primary" type="submit"
                      [disabled]="form.invalid || loading()">
                {{ loading() ? 'Création…' : 'Créer' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .full-w { width: 100%; }
    .error { color: #d32f2f; margin: 0 0 12px; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
  `]
})
export class ProjectCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['']
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.projectService.create(this.form.getRawValue()).subscribe({
      next: p => this.router.navigate(['/projects', p.id]),
      error: err => {
        this.error.set(err.error?.message ?? 'Erreur');
        this.loading.set(false);
      }
    });
  }
}
