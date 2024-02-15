import { Injectable, NgZone } from '@angular/core';

// API of Redux DevTools (npm `@redux-devtools/extension`) is described here:
// https://github.com/reduxjs/redux-devtools/blob/main/extension/docs/API/README.md
// src:
// https://github.com/reduxjs/redux-devtools/blob/main/extension/src/pageScript/index.ts

interface ReduxDevtoolsExtension {
  connect(options: { name: string }): ConnectResponse;
}

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__: ReduxDevtoolsExtension;
  }
}

interface ConnectResponse {
  init: (state: Record<string, any>) => void;
  send: (action: string, state: Record<string, any>) => void;
}

/** Service which provides simplified API to Redux DevTools. */
@Injectable({
  providedIn: 'root',
})
export class DevtoolsService {
  private globalDevtools: ReduxDevtoolsExtension =
    window.__REDUX_DEVTOOLS_EXTENSION__;
  private localDevTool!: ConnectResponse;
  private isActiveDevtool = false;

  constructor(ngZone: NgZone) {
    if (this.globalDevtools) {
      ngZone.runOutsideAngular(() => {
        this.localDevTool = this.globalDevtools.connect({
          name: 'ngx-state-service',
        });
        this.isActiveDevtool = !!this.localDevTool;
        if (this.isActiveDevtool) {
          this.localDevTool.init({});
        }
      });
    }
  }

  /**
   * Return true if devtools is active.
   */
  get isActive() {
    return this.isActiveDevtool;
  }

  /**
   * Send to devtools a new state.
   * @param storeName - The store name.
   * @param actionName - The action name.
   * @param state - The state.
   */
  send(storeName: string, actionName: string, state: Record<string, any>) {
    if (this.isActiveDevtool) {
      this.localDevTool.send(`${storeName}.${actionName}`, state);
    }
  }
}
