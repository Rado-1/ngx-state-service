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
    state.setDeep({ c: { f: [1, 2, 3] }, a: 2 });
    expect(state.value).toEqual({
      a: 2,
      b: '1',
      c: { d: 1, e: '1', f: [1, 2, 3] },
    });
  });
});
