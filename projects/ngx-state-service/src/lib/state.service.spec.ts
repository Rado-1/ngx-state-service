import { TestBed } from '@angular/core/testing';
import { StateService } from './state.service';
import { takeWhile } from 'rxjs';

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

    state.set({ c: { f: [1, 2, 3] }, a: 2 }, { isDeep: true });
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

  it('propagates selected sub-state and derived values', (done: DoneFn) => {
    state.set({ a: 3 });
    let res: any[] = [];

    state
      .select((st) => ({ square: st.a * st.a }))
      .pipe(takeWhile((val) => val.square !== 0))
      .subscribe({
        next: (val) => {
          res.push(val);
        },
        complete: () => {
          expect(res).toEqual([{ square: 9 }, { square: 4 }, { square: 169 }]);
          done();
        },
      });
    state.set({ a: 2 });
    state.set({ a: 13 });
    state.set({ a: 0 }); // finish
  });

  it('can use storage', () => {
    state.config({
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
