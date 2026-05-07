import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TaskService } from './task.service';
import { environment } from '../../../environments/environment';

describe('TaskService', () => {
  let service: TaskService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaskService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TaskService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('liste les tâches du projet', () => {
    service.listByProject(5).subscribe(list => expect(list).toHaveLength(1));
    const req = http.expectOne(`${environment.apiUrl}/projects/5/tasks`);
    req.flush([{
      id: 1, name: 'T', description: null, priority: 'MEDIUM', status: 'TODO',
      dueDate: null, projectId: 5, assigneeId: null, assigneeUsername: null,
      createdByUsername: 'x', createdAt: '', updatedAt: ''
    }]);
  });

  it('crée une tâche', () => {
    service.create(5, { name: 'N' }).subscribe(t => expect(t.id).toBe(1));
    const req = http.expectOne(`${environment.apiUrl}/projects/5/tasks`);
    expect(req.request.method).toBe('POST');
    req.flush({
      id: 1, name: 'N', description: null, priority: 'MEDIUM', status: 'TODO',
      dueDate: null, projectId: 5, assigneeId: null, assigneeUsername: null,
      createdByUsername: 'x', createdAt: '', updatedAt: ''
    });
  });

  it('met à jour une tâche', () => {
    service.update(10, { name: 'X', status: 'DONE' }).subscribe(t => {
      expect(t.status).toBe('DONE');
    });
    const req = http.expectOne(`${environment.apiUrl}/tasks/10`);
    expect(req.request.method).toBe('PUT');
    req.flush({
      id: 10, name: 'X', description: null, priority: 'MEDIUM', status: 'DONE',
      dueDate: null, projectId: 5, assigneeId: null, assigneeUsername: null,
      createdByUsername: 'x', createdAt: '', updatedAt: ''
    });
  });

  it('supprime une tâche', () => {
    service.delete(10).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/tasks/10`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('récupère l\'historique', () => {
    service.history(10).subscribe(list => expect(list).toHaveLength(1));
    const req = http.expectOne(`${environment.apiUrl}/tasks/10/history`);
    req.flush([{
      id: 1, username: 'alice', fieldChanged: 'status',
      oldValue: 'TODO', newValue: 'DONE', changedAt: '2026-01-01'
    }]);
  });
});
