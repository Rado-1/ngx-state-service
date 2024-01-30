// https://stackoverflow.com/questions/41980195/recursive-partialt-in-typescript
export type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
    ? RecursivePartial<T[P]>
    : T[P];
};

/** Immutable, non-recursive setting of object's properties. */
export function mut<
  T extends RecursivePartial<U>,
  U extends Record<string, any>
>(obj: T, props: U): T {
  return { ...obj, ...props };
}

/** Immutable setting of object's properties recursively. Simple types and
arrays are copied, objects are recursed. */
export function mutDeep<
  T extends RecursivePartial<U>,
  U extends Record<string, any>
>(obj: T, props: U): T {
  let res = obj;

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      res = { ...res, ...{ [key]: mutDeep(res[key] as any, value) } };
    } else {
      res = { ...res, ...{ [key]: value } };
    }
  }

  return res;
}
