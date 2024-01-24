import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RecursivePartial, mut, mutDeep } from './utils';

@Injectable()
export class StateService<T extends Record<string, any>> {
  private stateValueSubject: BehaviorSubject<T | undefined>;
  value$: Observable<T | undefined>;

  constructor() {
    this.stateValueSubject = new BehaviorSubject<T | undefined>(undefined);
    this.value$ = this.stateValueSubject.asObservable();
  }

  get value() {
    return this.stateValueSubject.value as T;
  }

  set<U extends RecursivePartial<T>>(statusUpdate: U, isDeep = false) {
    const val = isDeep
      ? mutDeep(this.value, statusUpdate)
      : mut(this.value, statusUpdate);

    this.stateValueSubject.next(val as T);
  }

  setDeep<U extends RecursivePartial<T>>(statusUpdate: U) {
    this.set(statusUpdate, true);
  }
}
