import { Observable, combineLatest, map } from 'rxjs';

// https://stackoverflow.com/questions/41980195/recursive-partialt-in-typescript
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
    ? RecursivePartial<T[P]>
    : T[P];
};

/**
 * Creates a shallow copy of an object with changed properties.
 * @param obj - Object to change.
 * @param  props - Properties and their values to change.
 * @returns Copy of the object with changed properties.
 */
export function mut<T extends Record<string, any>, U extends Partial<T>>(
  obj: T,
  props: U
): T {
  return { ...obj, ...props };
}

/**
 * Creates a deep copy of an object with changed properties. Simple types and
 * arrays are copied, objects are recursed.
 * @param obj - Object to change.
 * @param  props - Properties and their values to change.
 * @returns Copy of the object with changed properties.
 */
export function mutDeep<
  T extends Record<string, any>,
  U extends RecursivePartial<T>
>(obj: T, props: U): T {
  let res = obj;

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      res = { ...res, ...{ [key]: mutDeep(res[key], value) } };
    } else {
      res = { ...res, ...{ [key]: value } };
    }
  }

  return res;
}

/**
 * Composes several observables to one in the form of RxJS combineLatest. The
 * resulting observable emits objects composed of all properties of all input
 * observable objects each time any input observable value is emitted.
 * @param observables Variadic parameter of observables to compose.
 * @returns Composed observable.
 */
export function compose(...observables: Observable<Record<string, any>>[]) {
  return combineLatest(observables).pipe(
    map((states) => Object.assign({}, ...states))
  );
}
