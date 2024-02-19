import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';
import { RecursivePartial, mut, mutDeep } from './utils';
import isEqual from 'lodash-es/isEqual';
import pick from 'lodash-es/pick';
import { DevtoolsService } from './devtools.service';

/**
 * Configuration of StateService.
 */
export interface StateServiceConfig {
  /** If true, Redux DevTools browser extension is enabled to inspect changes of
   * state.
   */
  enableDevTools?: boolean;

  /**
   * If true, changes of state are logged to console.
   */
  enableConsoleLog?: boolean;

  /**
   * If true, the state is persisted in storage.
   */
  enableStorage?: boolean;

  /**
   * Storage for persisting the state. Either `localStorage` or
   * `sessionStorage`.
   */
  storage?: Storage;

  /**
   * The name of the state used in Redux DevTools, console log and also as the
   * key for storage.
   */
  stateName?: string;
}

/**
 * Options for `set` method.
 */
export interface StateSettingOptions {
  /**
   * Optional name of the action used by console logging or by Redux DevTools.
   */
  actionName?: string;
}

let stateId = 0;

/**
 * Non-singleton service that manages immutable state, provides its getters and
 * setters and propagates changes of the state for subscribers. It is
 * parametrized with an interface of type T representing the structure of the
 * state .
 */
@Injectable()
export class StateService<T extends Record<string, any>> {
  private configuration: StateServiceConfig = {
    enableDevTools: false,
    enableConsoleLog: false,
    enableStorage: false,
    storage: localStorage,
    stateName: 'STATE_' + stateId++,
  };
  private useStorage = false;
  private useDevtools = false;
  private devtools = inject(DevtoolsService);

  private stateValueSubject: BehaviorSubject<T>;
  /**
   * Observable of the current state value.
   */
  value$: Observable<T>;

  /**
   * Signal of the current state value.
   */
  valueSignal: WritableSignal<T> = signal(undefined as any);

  constructor() {
    this.stateValueSubject = new BehaviorSubject<T>(undefined as any);
    this.value$ = this.stateValueSubject.asObservable();
  }

  /**
   * Updates configuration of StateService instance with all or some properties.
   * @param configUpdate - Object of updated configuration properties.
   */
  config(configUpdate: StateServiceConfig) {
    this.configuration = { ...this.configuration, ...configUpdate };

    this.useStorage =
      !!this.configuration.enableStorage &&
      !!this.configuration.storage &&
      !!this.configuration.stateName;

    if (configUpdate.enableStorage && this.useStorage) {
      const storedVal = this.configuration.storage!.getItem(
        this.configuration.stateName!
      );

      if (storedVal) {
        const val = JSON.parse(storedVal) as T;
        this.stateValueSubject.next(val);
        this.valueSignal.set(val);
      }
    }

    this.useDevtools =
      !!this.configuration.enableDevTools && !!this.configuration.stateName;
  }

  /**
   * Returns the current state value.
   */
  get value() {
    return this.stateValueSubject.value as T;
  }

  /** @internal */
  private _set<U extends RecursivePartial<T>>(
    statusUpdate: U | ((status: T) => U),
    updateFn: (obj: T, props: U) => T,
    options?: StateSettingOptions
  ) {
    // defaults
    const actionName = options?.actionName ?? 'set';

    const statusUpdateValue =
      typeof statusUpdate === 'function'
        ? statusUpdate(this.value)
        : statusUpdate;
    const val = updateFn(this.value, statusUpdateValue);

    this.stateValueSubject.next(val as T);
    this.valueSignal.set(val);

    if (this.useStorage) {
      this.configuration.storage!.setItem(
        this.configuration.stateName!,
        JSON.stringify(val)
      );
    }

    if (this.configuration.enableConsoleLog) {
      console.log(`${this.configuration.stateName}.${actionName}`, val);
    }

    if (this.useDevtools) {
      this.devtools.send(this.configuration.stateName!, actionName, val);
    }
  }

  /**
   * Sets properties of state and propagates the change.
   * @param statusUpdate - Changed properties of state and their new values. It
   * is given either as an object or as a function returning object.
   * @param options - Optional state setting options. Default `actionName` is
   * *'set'*.
   */
  set(
    statusUpdate: Partial<T> | ((status: T) => Partial<T>),
    options?: StateSettingOptions
  ) {
    this._set(statusUpdate, mut, options);
  }

  /**
   * Sets properties of state deeply and propagates the change.
   * @param statusUpdate - Changed properties of state and their new values. It
   * is given either as an object or as a function returning object.
   * @param options - Optional state setting options. Default `actionName` is
   * *'set'*.
   */
  setDeep(
    statusUpdate: RecursivePartial<T> | ((status: T) => RecursivePartial<T>),
    options?: StateSettingOptions
  ) {
    this._set(statusUpdate, mutDeep, options);
  }

  /**
   * Selects a sub-state.
   * @param keys An array of state property keys to select.
   * @param comparator An optional function used to compare the previous and
   * the current selected tate for equality. Default is Lodash isEqual check.
   * @returns Observable of the selected sub-state.
   */
  select<K extends keyof T, U extends Pick<T, K>>(
    keys: K[],
    comparator?: (previous: U, current: U) => boolean
  ): Observable<U>;

  /**
   * Selects a sub-state or transforms the state to another type.
   * @param selector A selection/transformation function.
   * @param comparator An optional function used to compare the previous and
   * the current transformed state for equality. Default is Lodash isEqual
   * check.
   * @returns Observable of the transformed state.
   */
  select<U>(
    selector: (state: T) => U,
    comparator?: (previous: U, current: U) => boolean
  ): Observable<U>;

  /**
   * @internal
   */
  select<U>(
    selector: (keyof U)[] | ((state: T) => U),
    comparator?: (previous: U, current: U) => boolean
  ) {
    const selectorFn =
      typeof selector === 'function'
        ? selector
        : (state: T) => pick(state, selector) as U;
    return this.value$.pipe(
      map(selectorFn),
      distinctUntilChanged(comparator ? comparator : isEqual)
    );
  }

  /**
   * Removes state from storage.
   * @param storage - Optional specification of storage. The default value is
   * taken from configuration `storage` property.
   */
  removeStoredState(storage?: Storage) {
    const usedStorage = storage ?? this.configuration.storage;

    if (!!usedStorage && !!this.configuration.stateName) {
      usedStorage.removeItem(this.configuration.stateName);
    }
  }
}
