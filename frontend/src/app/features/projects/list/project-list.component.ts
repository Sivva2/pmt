import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/models';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="container">
      <div class="page-header">
        <h1>Mes projets</h1>
        <button mat-flat-button color="primary" routerLink="/projects/new">
          <mat-icon>add</mat-icon> Nouveau projet
        </button>
      </div>

      @if (loading()) {
        <p>Chargement…</p>
      } @else if (projects().length === 0) {
        <div class="empty-state">
          <mat-icon style="font-size:48px;width:48px;height:48px;">folder_open</mat-icon>
          <h3>Aucun projet</h3>
          <p>Créez votre premier projet pour commencer à collaborer.</p>
          <button mat-flat-button color="primary" routerLink="/projects/new">
            Créer un projet
          </button>
        </div>
      } @else {
        <div class="card-grid">
          @for (p of projects(); track p.id) {
            <mat-card class="project-card" (click)="open(p.id)">
              <mat-card-header>
                <mat-card-title>{{ p.name }}</mat-card-title>
                <mat-card-subtitle>par {{ p.createdByUsername }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p class="desc">{{ p.description || 'Pas de description' }}</p>
                <p class="date">Créé le {{ p.createdAt | date:'dd/MM/yyyy' }}</p>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .project-card { cursor: pointer; transition: transform .15s, box-shadow .15s; }
    .project-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.12); }
    .desc { color: #555; min-height: 42px; }
    .date { font-size: 12px; color: #888; margin: 0; }
  `]
})
export class ProjectListComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.projectService.list().subscribe({
      next: list => { this.projects.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  open(id: number): void {
    this.router.navigate(['/projects', id]);
  }
}
