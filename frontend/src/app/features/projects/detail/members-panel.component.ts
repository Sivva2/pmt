import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProjectService } from '../../../core/services/project.service';
import { ProjectMember, Role } from '../../../core/models/models';

@Component({
  selector: 'app-members-panel',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatListModule, MatChipsModule
  ],
  template: `
    <div class="members-layout">
      <mat-card class="invite-card">
        <mat-card-header>
          <mat-card-title>Inviter un membre</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="invite()">
            <mat-form-field appearance="outline" class="full-w">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-w">
              <mat-label>Rôle</mat-label>
              <mat-select formControlName="role">
                <mat-option value="ADMIN">Administrateur</mat-option>
                <mat-option value="MEMBER">Membre</mat-option>
                <mat-option value="OBSERVER">Observateur</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit"
                    [disabled]="form.invalid || loading()" class="full-w">
              <mat-icon>person_add</mat-icon> Inviter
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="list-card">
        <mat-card-header>
          <mat-card-title>Membres ({{ members().length }})</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-list>
            @for (m of members(); track m.id) {
              <mat-list-item>
                <mat-icon matListItemIcon>account_circle</mat-icon>
                <div matListItemTitle>{{ m.username }}</div>
                <div matListItemLine>{{ m.email }}</div>
                <mat-chip [class]="'role-' + m.role.toLowerCase()">{{ roleLabel(m.role) }}</mat-chip>
              </mat-list-item>
            }
          </mat-list>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .members-layout {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 16px;
      padding-top: 16px;
    }
    @media (max-width: 700px) {
      .members-layout { grid-template-columns: 1fr; }
    }
    .full-w { width: 100%; }
    .role-admin { background: #fee2e2; color: #991b1b; }
    .role-member { background: #dbeafe; color: #1e40af; }
    .role-observer { background: #e5e7eb; color: #374151; }
  `]
})
export class MembersPanelComponent implements OnInit {
  @Input({ required: true }) projectId!: number;

  private readonly fb = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly snackBar = inject(MatSnackBar);

  readonly members = signal<ProjectMember[]>([]);
  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['MEMBER' as Role, Validators.required]
  });

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.projectService.listMembers(this.projectId).subscribe(m => this.members.set(m));
  }

  invite(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.projectService.invite(this.projectId, this.form.getRawValue()).subscribe({
      next: () => {
        this.snackBar.open('Membre invité avec succès', 'OK', { duration: 2500 });
        this.form.reset({ email: '', role: 'MEMBER' });
        this.loadMembers();
        this.loading.set(false);
      },
      error: err => {
        this.snackBar.open(err.error?.message ?? 'Erreur', 'OK', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  roleLabel(r: Role): string {
    return { ADMIN: 'Admin', MEMBER: 'Membre', OBSERVER: 'Observateur' }[r];
  }
}
