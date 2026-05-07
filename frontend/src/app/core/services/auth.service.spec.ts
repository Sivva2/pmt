import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('démarre non authentifié', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('connecte un utilisateur et persiste dans localStorage', () => {
    const user = { id: 1, username: 'alice', email: 'a@a.com' };

    service.login({ email: 'a@a.com', password: 'password' }).subscribe(u => {
      expect(u).toEqual(user);
    });

    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(user);

    expect(service.currentUser()).toEqual(user);
    expect(service.isAuthenticated()).toBe(true);
    expect(JSON.parse(localStorage.getItem('pmt_current_user')!)).toEqual(user);
  });

  it('enregistre un nouvel utilisateur', () => {
    const user = { id: 2, username: 'bob', email: 'b@b.com' };
    service.register({ username: 'bob', email: 'b@b.com', password: 'password' })
      .subscribe(u => expect(u).toEqual(user));

    const req = http.expectOne(`${environment.apiUrl}/auth/register`);
    req.flush(user);

    expect(service.currentUser()).toEqual(user);
  });

  it('déconnecte et vide le localStorage', () => {
    localStorage.setItem('pmt_current_user', JSON.stringify({ id: 1, username: 'a', email: 'a@a.com' }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()]
    });
    const s = TestBed.inject(AuthService);

    expect(s.isAuthenticated()).toBe(true);
    s.logout();
    expect(s.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('pmt_current_user')).toBeNull();
  });

  it('récupère l\'utilisateur depuis localStorage au démarrage', () => {
    const user = { id: 5, username: 'x', email: 'x@x.com' };
    localStorage.setItem('pmt_current_user', JSON.stringify(user));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()]
    });
    const s = TestBed.inject(AuthService);

    expect(s.currentUser()).toEqual(user);
  });
});
