import { TestBed } from '@angular/core/testing';
import { StateService } from './state.service';

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

    state.set({ c: { f: [1, 2, 3] }, a: 2 }, true);
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
    state
      .select((st) => ({ square: st.a * st.a }))
      .subscribe((value) => {
        expect(value).toEqual({ square: 9 });
        done();
      });
  });
});
