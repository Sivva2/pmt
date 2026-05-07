import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const user = auth.currentUser();

  // On n'ajoute pas le header sur les routes d'auth (register/login)
  const isAuthRoute = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  if (user && !isAuthRoute) {
    const cloned = req.clone({
      setHeaders: { 'X-User-Id': String(user.id) }
    });
    return next(cloned);
  }

  return next(req);
};
