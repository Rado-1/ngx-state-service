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
  /**
   * If true, changes of state are propagated by RxJS Observable.
   */
  useObservable?: boolean;

  /**
   * If true, changes of state are propagated by signal.
   */
  useSignal?: boolean;

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

  /**
   * If true, notification about changing the state is not sent. Else,
   * notification is sent.
   */
  quiet?: boolean;
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
  private _configuration: StateServiceConfig = {
    useObservable: true,
    useSignal: false,
    enableDevTools: false,
    enableConsoleLog: false,
    enableStorage: false,
    storage: localStorage,
    stateName: 'STATE_' + stateId++,
  };
  private _useStorage = false;
  private _useDevtools = false;
  private _devtools = inject(DevtoolsService);

  private _stateValueSubject = new BehaviorSubject<T>(undefined as any);

  /**
   * Observable of the current state value.
   */
  readonly value$ = this._stateValueSubject.asObservable();

  /**
   * Signal of the current state value.
   */
  readonly valueSignal: WritableSignal<T> = signal(undefined as any);

  /**
   * Updates configuration of StateService instance with all or some properties.
   * @param configUpdate - Object of updated configuration properties.
   */
  config(configUpdate: StateServiceConfig) {
    this._configuration = { ...this._configuration, ...configUpdate };

    this._useStorage =
      !!this._configuration.enableStorage &&
      !!this._configuration.storage &&
      !!this._configuration.stateName;

    if (configUpdate.enableStorage && this._useStorage) {
      const storedVal = this._configuration.storage!.getItem(
        this._configuration.stateName!
      );

      if (storedVal) {
        const val = JSON.parse(storedVal) as T;

        if (this._configuration.useObservable) {
          this._stateValueSubject.next(val);
        }

        if (this._configuration.useSignal) {
          setTimeout(() => this.valueSignal.set(val));
        }
      }
    }

    this._useDevtools =
      !!this._configuration.enableDevTools && !!this._configuration.stateName;
  }

  /**
   * Returns the current state value.
   */
  get value() {
    return this._stateValueSubject.value as T;
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

    if (options?.quiet !== true && this._configuration.useObservable) {
      this._stateValueSubject.next(val);
    }

    if (options?.quiet !== true && this._configuration.useSignal) {
      this.valueSignal.set(val);
    }

    if (this._useStorage) {
      this._configuration.storage!.setItem(
        this._configuration.stateName!,
        JSON.stringify(val)
      );
    }

    if (this._configuration.enableConsoleLog) {
      console.log(`${this._configuration.stateName}.${actionName}`, val);
    }

    if (this._useDevtools) {
      this._devtools.send(this._configuration.stateName!, actionName, val);
    }
  }

  /**
   * Sets properties of state and propagates the change.
   * @param statusUpdate - Changed properties of state and their new values. It
   * is given either as an object or as a function with parameter representing
   * the current state and returning its new value.
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
   * is given either as an object or as a function with parameter representing
   * the current state and returning its new value.
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
    const usedStorage = storage ?? this._configuration.storage;

    if (!!usedStorage && !!this._configuration.stateName) {
      usedStorage.removeItem(this._configuration.stateName);
    }
  }
}
