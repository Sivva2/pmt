import { of } from 'rxjs';

/**
 * Crée un HttpClient mocké minimal pour les tests unitaires.
 * Toutes les méthodes (get, post, put, delete) renvoient l'observable défini par le test.
 */
export function createHttpMock() {
  return {
    get: jest.fn().mockReturnValue(of(null)),
    post: jest.fn().mockReturnValue(of(null)),
    put: jest.fn().mockReturnValue(of(null)),
    delete: jest.fn().mockReturnValue(of(null))
  };
}

/**
 * Mock du module @angular/core inject() pour les tests.
 * Permet de retourner notre HttpClient mocké quand le service appelle inject(HttpClient).
 */
export function mockInject(httpMock: any) {
  jest.doMock('@angular/core', () => {
    const actual = jest.requireActual('@angular/core');
    return {
      ...actual,
      inject: () => httpMock
    };
  });
}