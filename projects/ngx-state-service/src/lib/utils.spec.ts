import { mut, mutDeep } from './utils';

describe('utils', () => {
  it('mut can change undefined', () => {
    expect(mut(undefined as any, { a: 2 })).toEqual({ a: 2 });
  });

  it('mut can change values of basic types', () => {
    expect(mut({ a: 1, b: 1 }, { a: 2 })).toEqual({ a: 2, b: 1 });

    expect(mut({ a: '1', b: 1 }, { a: '2' })).toEqual({ a: '2', b: 1 });

    expect(mut({ a: '1', b: true }, { b: false })).toEqual({
      a: '1',
      b: false,
    });

    expect(mut({ a: 1, b: 1, c: '1' }, { a: 2, c: '2' })).toEqual({
      a: 2,
      b: 1,
      c: '2',
    });
  });

  it('mut can change values of composite types', () => {
    expect(mut({ a: { b: 1, c: 1 }, d: 1 }, { a: { b: 2 } })).toEqual({
      a: { b: 2 },
      d: 1,
    });

    expect(mut({ a: [1, 2, 3], b: 1 }, { a: [2] })).toEqual({ a: [2], b: 1 });
  });

  it('mut can set undefined', () => {
    expect(mut({ a: 1, b: 1 } as any, { a: undefined })).toEqual({
      a: undefined,
      b: 1,
    });
  });

  it('mutDeep can change multiple recursive values', () => {
    expect(
      mutDeep({ a: { b: 1, c: { d: 1, e: 1 } }, f: 1 }, { a: { c: { d: 2 } } })
    ).toEqual({
      a: { b: 1, c: { d: 2, e: 1 } },
      f: 1,
    });

    expect(
      mutDeep(
        { a: { b: 1, c: { d: [1, 2, 3], e: [1] } }, f: '1' },
        { a: { c: { d: [3, 2] } }, f: '2' }
      )
    ).toEqual({
      a: { b: 1, c: { d: [3, 2], e: [1] } },
      f: '2',
    });
  });
});
