import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, TaskHistoryEntry, Priority, Status } from '../models/models';

export interface TaskPayload {
  name: string;
  description?: string | null;
  priority?: Priority;
  status?: Status;
  dueDate?: string | null;
  assigneeId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  listByProject(projectId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/projects/${projectId}/tasks`);
  }

  create(projectId: number, payload: TaskPayload): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/projects/${projectId}/tasks`, payload);
  }

  update(taskId: number, payload: TaskPayload): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/tasks/${taskId}`, payload);
  }

  delete(taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${taskId}`);
  }

  history(taskId: number): Observable<TaskHistoryEntry[]> {
    return this.http.get<TaskHistoryEntry[]>(`${this.apiUrl}/tasks/${taskId}/history`);
  }
}
