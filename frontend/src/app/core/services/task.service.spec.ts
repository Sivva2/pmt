import { of } from 'rxjs';
import { setInjectMock } from '../../../__mocks__/angular-core';
import { TaskService } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let mockHttp: any;

  beforeEach(() => {
    mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
    setInjectMock(() => mockHttp);
    service = new TaskService();
  });

  it('liste les tâches du projet', (done) => {
    mockHttp.get.mockReturnValue(of([{ id: 1 }]));
    service.listByProject(5).subscribe((t: any) => {
      expect(t).toHaveLength(1);
      done();
    });
  });

  it('crée une tâche', (done) => {
    mockHttp.post.mockReturnValue(of({ id: 10 }));
    service.create(5, { name: 'T' }).subscribe((t: any) => {
      expect(t.id).toBe(10);
      done();
    });
  });

  it('met à jour une tâche', (done) => {
    mockHttp.put.mockReturnValue(of({ id: 10, name: 'Up' }));
    service.update(10, { name: 'Up' }).subscribe((t: any) => {
      expect(t.name).toBe('Up');
      done();
    });
  });

  it('supprime une tâche', (done) => {
    mockHttp.delete.mockReturnValue(of(undefined));
    service.delete(10).subscribe(() => {
      expect(mockHttp.delete).toHaveBeenCalled();
      done();
    });
  });

  it('récupère lhistorique', (done) => {
    mockHttp.get.mockReturnValue(of([{ action: 'CREATE' }]));
    service.history(10).subscribe((h: any) => {
      expect(h).toHaveLength(1);
      done();
    });
  });
});
