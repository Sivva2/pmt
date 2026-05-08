import { of } from 'rxjs';
import { setInjectMock } from '../../../__mocks__/angular-core';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockHttp: any;

  beforeEach(() => {
    localStorage.clear();
    mockHttp = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };
    setInjectMock(() => mockHttp);
    service = new AuthService();
  });

  afterEach(() => localStorage.clear());

  it('démarre non authentifié', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('connecte un utilisateur et persiste dans localStorage', (done) => {
    const fakeUser = { id: 1, username: 'alice', email: 'a@b.c' };
    mockHttp.post.mockReturnValue(of(fakeUser));
    service.login({ email: 'a@b.c', password: 'pwd' }).subscribe(user => {
      expect(user).toEqual(fakeUser);
      expect(service.isAuthenticated()).toBe(true);
      expect(localStorage.getItem('pmt_current_user')).toContain('alice');
      done();
    });
  });

  it('enregistre un nouvel utilisateur', (done) => {
    const fakeUser = { id: 2, username: 'bob', email: 'b@c.d' };
    mockHttp.post.mockReturnValue(of(fakeUser));
    service.register({ username: 'bob', email: 'b@c.d', password: 'pwd' }).subscribe(user => {
      expect(user).toEqual(fakeUser);
      expect(service.isAuthenticated()).toBe(true);
      done();
    });
  });

  it('déconnecte et vide le localStorage', () => {
    localStorage.setItem('pmt_current_user', JSON.stringify({ id: 1 }));
    service.logout();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('pmt_current_user')).toBeNull();
  });

  it('récupère lutilisateur depuis localStorage au démarrage', () => {
    localStorage.setItem('pmt_current_user', JSON.stringify({ id: 99, username: 'persisted' }));
    const newService = new AuthService();
    expect(newService.isAuthenticated()).toBe(true);
    expect(newService.currentUser()?.username).toBe('persisted');
  });
});
