import { of } from 'rxjs';
import { setInjectMock } from '../../../__mocks__/angular-core';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let mockHttp: any;

  beforeEach(() => {
    mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
    setInjectMock(() => mockHttp);
    service = new ProjectService();
  });

  it('liste les projets', (done) => {
    mockHttp.get.mockReturnValue(of([{ id: 1 }, { id: 2 }]));
    service.list().subscribe((list: any) => {
      expect(list).toHaveLength(2);
      done();
    });
  });

  it('récupère un projet par id', (done) => {
    mockHttp.get.mockReturnValue(of({ id: 5, name: 'Test' }));
    service.get(5).subscribe((p: any) => {
      expect(p.id).toBe(5);
      done();
    });
  });

  it('crée un projet', (done) => {
    const newProject = { id: 10, name: 'Nouveau' };
    mockHttp.post.mockReturnValue(of(newProject));
    service.create({ name: 'Nouveau', description: 'D' }).subscribe((p: any) => {
      expect(p).toEqual(newProject);
      done();
    });
  });

  it('liste les membres', (done) => {
    mockHttp.get.mockReturnValue(of([{ userId: 1, role: 'ADMIN' }]));
    service.listMembers(7).subscribe((m: any) => {
      expect(m).toHaveLength(1);
      done();
    });
  });

  it('invite un membre', (done) => {
    mockHttp.post.mockReturnValue(of({ userId: 2, role: 'MEMBER' }));
    service.invite(7, { email: 'x@y.z', role: 'MEMBER' as any }).subscribe((m: any) => {
      expect(m.role).toBe('MEMBER');
      done();
    });
  });
});
