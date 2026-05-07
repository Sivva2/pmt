import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/models';
import { TaskBoardComponent } from '../../tasks/board/task-board.component';
import { MembersPanelComponent } from './members-panel.component';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatTabsModule, MatButtonModule, MatIconModule,
    TaskBoardComponent, MembersPanelComponent
  ],
  template: `
    <div class="container">
      <div class="page-header">
        <div>
          <a mat-button routerLink="/projects">
            <mat-icon>arrow_back</mat-icon> Projets
          </a>
          @if (project()) {
            <h1>{{ project()!.name }}</h1>
            <p class="subtitle">{{ project()!.description }}</p>
          }
        </div>
      </div>

      @if (projectId()) {
        <mat-tab-group animationDuration="150ms">
          <mat-tab label="Tableau">
            <app-task-board [projectId]="projectId()!"></app-task-board>
          </mat-tab>
          <mat-tab label="Membres">
            <app-members-panel [projectId]="projectId()!"></app-members-panel>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .subtitle { color: #666; margin-top: -8px; }
  `]
})
export class ProjectDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);

  readonly project = signal<Project | null>(null);
  readonly projectId = signal<number | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.projectId.set(id);
    this.projectService.get(id).subscribe(p => this.project.set(p));
  }
}
