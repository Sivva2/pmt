// Mock minimal de @angular/core pour les tests unitaires (sans framework Angular)
let injectImpl: any = () => null;

export function setInjectMock(fn: any) {
  injectImpl = fn;
}

export function inject(token: any) {
  return injectImpl(token);
}

export function Injectable(_config?: any): any {
  return (target: any) => target;
}

// Signal minimal qui imite l'API Angular
export function signal<T>(initial: T): any {
  let value = initial;
  const fn: any = () => value;
  fn.set = (v: T) => { value = v; };
  fn.update = (mutator: (v: T) => T) => { value = mutator(value); };
  fn.asReadonly = () => fn;
  return fn;
}

// Computed minimal
export function computed<T>(fn: () => T): any {
  return () => fn();
}
