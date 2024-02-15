import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, distinctUntilChanged, map } from 'rxjs';
import { RecursivePartial, mut, mutDeep } from './utils';
import isEqual from 'lodash-es/isEqual';
import { DevtoolsService } from './devtools.service';

/**
 * Configuration of StateService.
 */
export interface StateServiceConfig {
  /** If true, Redux DevTools browser extension is enabled to inspect changes of
   * state.
   */
  enableDevTools?: boolean;

  /** If true, changes of state are logged to console. */
  enableConsoleLog?: boolean;

  /** If true, the state is persisted in storage. */
  enableStorage?: boolean;

  /** Storage for persisting the state. Either `localStorage` or
   * `sessionStorage`.
   */
  storage?: Storage;

  /** The name of the state used in Redux DevTools, console log and also as the
   * key for storage.
   */
  stateName?: string;
}

/**
 * Options for `set` method.
 */
export interface StateSettingOptions {
  /** If true, the nested status is changed recursively. If false,
   * only the top-level properties are changed.
   */
  isDeep?: boolean;

  /** Optional name of the action used by console logging or by Redux DevTools.
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
  /** Observable of the current state. */
  value$: Observable<T>;

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
      const val = this.configuration.storage!.getItem(
        this.configuration.stateName!
      );

      if (val) {
        this.stateValueSubject.next(JSON.parse(val) as T);
      }
    }

    this.useDevtools =
      !!this.configuration.enableDevTools && !!this.configuration.stateName;
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
   * @param options - State setting options. Default `isDeep` is *false* and
   * `actionName` is *'set'*.
   */
  set<U extends RecursivePartial<T>>(
    statusUpdate: U | ((status: T) => U),
    options?: StateSettingOptions
  ) {
    // defaults
    const isDeep = options?.isDeep ?? false;
    const actionName = options?.actionName ?? 'set';

    const statusUpdateValue =
      typeof statusUpdate === 'function'
        ? statusUpdate(this.value)
        : statusUpdate;
    const val = isDeep
      ? mutDeep(this.value, statusUpdateValue)
      : mut(this.value, statusUpdateValue);

    this.stateValueSubject.next(val as T);

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
   * Sets properties of state deeply and propagates the change.
   * @param statusUpdate - Changed properties of state and their new values. It
   * is given either as an object or as a function returning object.
   * @param options - State setting options. `isDeep` is always set to *true*.
   */
  setDeep<U extends RecursivePartial<T>>(
    statusUpdate: U | ((status: T) => U),
    options?: StateSettingOptions
  ) {
    this.set(statusUpdate, { ...options, isDeep: true });
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

  /**
   * Removes state from storage.
   * @param storage - Optional specification of storage. The default value is taken
   * from configuration `storage` property.
   */
  removeStoredState(storage?: Storage) {
    const usedStorage = storage ?? this.configuration.storage;

    if (!!usedStorage && !!this.configuration.stateName) {
      usedStorage.removeItem(this.configuration.stateName);
    }
  }
}
