import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';
import { RecursivePartial, mut, mutDeep } from './utils';
import isEqual from 'lodash-es/isEqual';

/**
 * Non-singleton service that manages immutable state, provides its getters and
 * setters and propagates changes of the state for subscribers. It is
 * parametrized with an interface of type T representing the structure of the
 * state .
 */
@Injectable()
export class StateService<T extends Record<string, any>> {
  private stateValueSubject: BehaviorSubject<T>;
  /** Observable of the current state. */
  value$: Observable<T>;

  constructor() {
    this.stateValueSubject = new BehaviorSubject<T>(undefined as any);
    this.value$ = this.stateValueSubject.asObservable();
  }

  /**
   * Returns the current state.
   */
  get value() {
    return this.stateValueSubject.value as T;
  }

  /**
   * Sets properties of state and propagates the change.
   * @param statusUpdate - Changed properties of state and their new values. It
   * is given either as an object or as a function returning object.
   * @param isDeep - If true, the nested status is changed recursively. If false,
   * only the top-level properties are changed.
   */
  set<U extends RecursivePartial<T>>(
    statusUpdate: U | ((status: T) => U),
    isDeep = false
  ) {
    const statusUpdateValue =
      typeof statusUpdate === 'function'
        ? statusUpdate(this.value)
        : statusUpdate;
    const val = isDeep
      ? mutDeep(this.value, statusUpdateValue)
      : mut(this.value, statusUpdateValue);

    this.stateValueSubject.next(val as T);
  }

  /**
   * Sets properties of state recursively and propagates the change.
   * @param statusUpdate - Changed properties of state and their new values. It
   * is given either as an object or as a function returning object.
   */
  setDeep<U extends RecursivePartial<T>>(statusUpdate: U | ((status: T) => U)) {
    this.set(statusUpdate, true);
  }

  /**
   * Selects a sub-state.
   * @param selectFn State selector function.
   * @param comparator A function used to compare the previous and current state
   * for equality. Default is Lodash isEqual check.
   * @returns Observable of the selected state.
   */
  select<U>(
    selectFn: (state: T) => U,
    comparator?: (previous: U, current: U) => boolean
  ) {
    return this.value$.pipe(
      map(selectFn),
      distinctUntilChanged(comparator ? comparator : isEqual)
    );
  }
}
