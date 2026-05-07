import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProjectService } from './project.service';
import { environment } from '../../../environments/environment';

describe('ProjectService', () => {
  let service: ProjectService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ProjectService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('liste les projets', () => {
    service.list().subscribe(list => expect(list).toHaveLength(2));
    const req = http.expectOne(`${environment.apiUrl}/projects`);
    expect(req.request.method).toBe('GET');
    req.flush([
      { id: 1, name: 'A', description: '', createdByUsername: 'x', createdAt: '' },
      { id: 2, name: 'B', description: '', createdByUsername: 'x', createdAt: '' }
    ]);
  });

  it('récupère un projet par id', () => {
    service.get(10).subscribe(p => expect(p.id).toBe(10));
    const req = http.expectOne(`${environment.apiUrl}/projects/10`);
    req.flush({ id: 10, name: 'X', description: '', createdByUsername: 'x', createdAt: '' });
  });

  it('crée un projet', () => {
    service.create({ name: 'New', description: 'D' }).subscribe(p => {
      expect(p.name).toBe('New');
    });
    const req = http.expectOne(`${environment.apiUrl}/projects`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'New', description: 'D' });
    req.flush({ id: 1, name: 'New', description: 'D', createdByUsername: 'x', createdAt: '' });
  });

  it('invite un membre', () => {
    service.invite(5, { email: 'x@x.com', role: 'MEMBER' }).subscribe(m => {
      expect(m.role).toBe('MEMBER');
    });
    const req = http.expectOne(`${environment.apiUrl}/projects/5/members`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1, userId: 2, username: 'x', email: 'x@x.com', role: 'MEMBER' });
  });

  it('liste les membres', () => {
    service.listMembers(5).subscribe(list => expect(list).toHaveLength(1));
    const req = http.expectOne(`${environment.apiUrl}/projects/5/members`);
    req.flush([{ id: 1, userId: 1, username: 'a', email: 'a@a.com', role: 'ADMIN' }]);
  });
});
