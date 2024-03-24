import { TestBed } from '@angular/core/testing';
import { StateService } from './state.service';
import { forkJoin, takeWhile, tap } from 'rxjs';

interface LocalState {
  a: number;
  b?: string;
  c?: { d: number; e: string; f?: number[] };
}

describe('StateService', () => {
  let state: StateService<LocalState>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [StateService] });
    state = TestBed.inject(StateService<LocalState>);
  });

  it('is created', () => {
    expect(state).toBeTruthy();
  });

  it('sets state and propagates as value', () => {
    state.set({ a: 1 });
    expect(state.value).toEqual({ a: 1 });

    state.set({ b: '1' });
    expect(state.value).toEqual({ a: 1, b: '1' });

    state.set((state) => ({ b: state.b + 'x' }));
    expect(state.value).toEqual({ a: 1, b: '1x' });
  });

  it('sets state and propagates as observable', (done: DoneFn) => {
    state.set({ a: 1, b: '1' });
    state.value$.subscribe((value) => {
      expect(value).toEqual({ a: 1, b: '1' });
      done();
    });
  });

  it('varies complex nested state', () => {
    state.set({ a: 1, b: '1', c: { d: 1, e: '1' } });

    state.setDeep({ c: { f: [1, 2, 3] }, a: 2 });
    expect(state.value).toEqual({
      a: 2,
      b: '1',
      c: { d: 1, e: '1', f: [1, 2, 3] },
    });

    state.setDeep({ c: { f: [3] }, a: 3 });
    expect(state.value).toEqual({
      a: 3,
      b: '1',
      c: { d: 1, e: '1', f: [3] },
    });
  });

  it('select propagates sub-state with own comparator', (done: DoneFn) => {
    state.set({ a: 1, b: '1', c: { d: 1, e: '1' } });
    let res: Pick<LocalState, 'a' | 'b'>[] = [];

    state
      .select(['a', 'b'], (v1, v2) => v1.a === v2.a && v1.b === v2.b)
      .pipe(takeWhile((val) => val.a !== 0))
      .subscribe({
        next: (val) => {
          res.push(val);
        },
        complete: () => {
          expect(res).toEqual([
            { a: 1, b: '1' },
            { a: 2, b: '1' },
            { a: 13, b: '2' },
          ]);
          done();
        },
      });
    state.set({ a: 2 });
    state.set({ a: 13, b: '2' });
    state.set({ a: 0 }); // finish
  });

  it('select propagates derived values', (done: DoneFn) => {
    state.set({ a: 3 });
    let res1: any[] = [];
    let res2: any[] = [];

    forkJoin([
      state
        .select((st) => ({ square: st.a * st.a }))
        .pipe(
          takeWhile((val) => val.square !== 0),
          tap((val) => {
            res1.push(val);
          })
        ),
      state
        .select((st) => st.a * st.a)
        .pipe(
          takeWhile((val) => val !== 0),
          tap((val) => {
            res2.push(val);
          })
        ),
    ]).subscribe({
      complete: () => {
        expect(res1).toEqual([{ square: 9 }, { square: 4 }, { square: 169 }]);
        expect(res2).toEqual([9, 4, 169]);
        done();
      },
    });

    state.set({ a: 2 });
    state.set({ a: 13 });
    state.set({ a: 0 }); // finish
  });

  it('can use storage', () => {
    state.config({
      enableConsoleLog: true,
      enableDevTools: true,
      enableStorage: true,
      storage: sessionStorage,
      stateName: 'Test',
    });
    state.set({ a: 0 });
    state.config({ enableStorage: false });
    state.set({ a: 1 });
    state.config({ enableStorage: true });
    expect(state.value).toEqual({ a: 0 });
    state.config({ enableStorage: false });
    state.removeStoredState();
    state.set({ a: 88 });
    state.config({ enableStorage: true });
    expect(state.value).toEqual({ a: 88 });
  });
});
