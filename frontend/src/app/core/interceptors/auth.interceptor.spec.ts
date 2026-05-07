import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpHandlerFn, HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('ajoute le header X-User-Id quand authentifié', () => {
    auth.login({ email: 'a@a.com', password: 'x' }).subscribe();
    const reqLogin = httpMock.expectOne(r => r.url.endsWith('/auth/login'));
    reqLogin.flush({ id: 42, username: 'a', email: 'a@a.com' });

    http.get('http://localhost:8080/api/projects').subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/projects');
    expect(req.request.headers.get('X-User-Id')).toBe('42');
    req.flush([]);
  });

  it('n\'ajoute pas le header pour /auth/login', () => {
    http.post('http://localhost:8080/api/auth/login', {}).subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    expect(req.request.headers.has('X-User-Id')).toBe(false);
    req.flush({});
  });

  it('n\'ajoute pas le header si non connecté', () => {
    http.get('http://localhost:8080/api/projects').subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/projects');
    expect(req.request.headers.has('X-User-Id')).toBe(false);
    req.flush([]);
  });
});
