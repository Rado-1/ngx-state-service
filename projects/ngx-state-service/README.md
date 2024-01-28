# ngx-state-service

Yet another lightweight state management library for Angular.

Version: 0.9.0

## About

**ngx-state-service** provides much simpler approach than other robust state
management libraries, like `ngrx` or`ngxs` based on or inspired by Redux, and is
intended for developers who need straightforward, type safe, effective, and
practically usable solution with minimal boilerplate.

Even if the primary intention for its creation was to solve the problem of local
component state for OnPush change detection strategy, it is usable also for
managing global application state.

## Concepts

State manager is provided by a non-singleton service, called `StateService`,
which can be injected to a component to manage its local state or to a
(singleton) service to manage global application state. This service keeps the
state, provides methods for changing the state and distributes the changes.

A `state` (component local or application global) is defined by an
interface, and therefore takes all advantages of TypeScript type system, e.g.,
type checking or content assistant in an IDE. StateService allows to modify
arbitrary part of the state (properties) at once. In addition, the state can
represent a nested structures which can be modified at arbitrary level of
nesting. This provides possibility to logically structure state by user's needs.

Internally, a state is represented by immutable object of which changes are
propagated to other parts of application as rsjx Observables. Another
possibility is to read the current status of state by getter. This allows
effective usage of state in component templates, including OnPush change
detection strategy.

## Compatibility with Angular versions

Angular `5.0.0` or higher is required.

## Installation

```
npm i ngx-state-service
```

## Initial setup

### Initializing state in standalone components

In standalone component, you just define the local state interface and inject
the service. The service is parametrized with the state interface.

```ts
import { StateService } from 'ngx-state-service';
...
interface LocalState {
  counter: number;
  counterMax?: number;
  counterPercent: number; // derived property
  countingStopped: boolean;
}
...
@Component({
  ...
  providers: [StateService],
})
export class CounterComponent {
...
  constructor(public localState: StateService<LocalState>) {

      // initial state
      this.localState.set({
        counter: 0,
        counterMax: 10,
        countingStopped: false,
      });
      ...
  }
  ...
}
```

Alternatively, you can omit locally defined provider for `StateService` and put
it to the global application configuration in `app.config.ts`.

```ts
export const appConfig: ApplicationConfig = {
  providers: [
  ...
  { provide: StateService, useClass: StateService }
  ...
  ],
};
```

### Initializing state in not standalone components

In not standalone component, omit `StateService` from `providers` property of the component config.

## Usage

### Updating state

Arbitrary subset of state top-level properties can be set by the `set` method.

```ts
this.localState.set({ counterMax: 10 });
```

In the case of nested state (where properties of a state are objects themselves),
updating of inner properties require setting of `isDeep` parameter to true or
use of `setDeep` method instead.

```ts
interface LocalState {
  a: number;
  b?: string[];
  c: { d: boolean; e: string };
}

// initial state
this.localState.set({ a: 1, c: { d: false, e: "x" } });

// isDeep parameter set to true
this.localState.set({ c: { e: "y" } }, true);
// or
this.localState.setDeep({ c: { e: "y" } });

console.log(this.localState.value);
// prints: {a:1, b: undefined, c: {d: false, e: 'y'}}
```

### Getting the current state

The current state is available in te `value` property of `StateService`.

```ts
this.localState.value.counterMax;
```

### Observing the current state

Component can subscribe for changes of state through the `value$` Observervable. This
is typically done in component template
with `OnPush` change strategy.

```ts
@if (localState.value$ | async; as state) {
  ...
  <div>
    {{ state.countingStopped ? "STOPPED" : state.counter }}
  </div>
  @if (!!state.counterMax) {
  <div class="progress" role="progressbar">
    <div
      class="progress-bar"
      [ngStyle]="{ width: state.counterPercent + '%' }"
    >
      {{ state.counterPercent | number : ".0-0" }}%
    </div>
  </div>
  }
  ...
}
```

Less usual example of subscribing for status changes is computation of derived properties, like this:

```ts
constructor() {
  ...
  // update counterPercent automatically
  // by changes of counter or counterMax
  this.localState.value$
    .pipe(
      takeUntilDestroyed(),
      distinctUntilChanged(
        (prev, curr) =>
          prev.counter === curr.counter &&
          prev.counterMax === curr.counterMax
      )
    )
    .subscribe((st) => {
      this.localState.value.counterPercent = st.counterMax
        ? (100 * st.counter) / st.counterMax
        : 0;
    });
  ...
}
```

## Global application state

### Defining global state service

The library itself does not provide global state, but it can be defined as
singleton service in the following way:

```ts
import { Injectable } from "@angular/core";
import { StateService } from "ngx-state-service";

export interface GlobalState {
  username: string;
  roles: Role[];
}

@Injectable({
  providedIn: "root",
})
export class GlobalStateService extends StateService<GlobalState> {}
```

### Usage global state service

Global state service is then used analogously to `StateService`.

```ts
constructor(
    private localState: StateService<LocalState>,
    private globalState: GlobalStateService
  ) {...}
```

### Combining global state with local component state

If both states are used in templates it is a good idea to combine them together
to avoid cascading @if statements.

```ts
interface UnifiedState extends LocalState, GlobalState {}

...
export class AnyComponent {
  state$: Observable<UnifiedState>;

  constructor(
      private localState: StateService<LocalState>,
      private globalState: GlobalStateService
    ) {
    ...
    // define unified state
    this.state$ = combineLatest([localState.value$, globalState.value$]).pipe(
      takeUntilDestroyed(),
      map(([localState, globalState]) => {
        return { ...localState, ...globalState };
      })
    );
    ...
  }
}
```

Then just use the `state$` Observable to subscribe for changes of either local or
global state containing all the unified state properties.

```ts
@if (state$ | async; as state) {
  <!-- from global state -->
  {{state.user}}
  <!-- from local state -->
  {{state.counter}}
}
```

## Demo project

[Here](projects/demo) you can find a demo project.