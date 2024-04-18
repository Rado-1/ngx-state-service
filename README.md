# ngx-state-service

![NPM Version](https://img.shields.io/npm/v/ngx-state-service)
![NPM License](https://img.shields.io/npm/l/ngx-state-service)

Lightweight state management library for Angular.

## Compatibility with Angular versions

Angular `16.0.0` or higher is required.

## About

**ngx-state-service** provides much simpler approach than other robust state
management libraries, such as [NgRx](https://ngrx.io/) or
[NGXS](https://www.ngxs.io/), and is intended for developers who need
straightforward, type safe, effective, and practically usable solution with
minimal boilerplate.

Even if the primary motivation was to solve the problem of local
component state for OnPush change detection strategy seamlessly propagated to
component template by RxJS Observables and Angular Signals, the library can be
used also for managing global application state shared among components.

## Concepts

State management is provided by a non-singleton service, called `StateService`,
which can be injected to a component to manage its local state or to a
(singleton) service, to manage global application state. This service
keeps the state, provides methods for setting and getting the state and
propagates its changes.

A `state` is defined by an interface, and therefore takes all advantages of
TypeScript type system, e.g., type checking or content assistance in an IDE.
`StateService` allows to modify arbitrary part of the state (set of properties)
at once. In addition, the state can be a nested structure of objects which can
be modified at arbitrary level of nesting.

Internally, a state is represented by an immutable object of which changes are
propagated to other parts of the application as [RxJS
Observable](https://rxjs.dev/guide/observable) or as [Angular
Signal](https://angular.dev/guide/signals). Another possibility is to read the
current value of state by getter. This combination of accessing allows effective
usage of state in component TypeScript code and templates, including OnPush
change detection strategy.

## Installation

```console
npm i ngx-state-service
```

## Initial setup

Define the local state interface and inject the service. The service is
parametrized with the state interface. To create a component-specific instance
of `StateService` list it in component's `providers`.

```ts
import { StateService } from 'ngx-state-service';
...
interface LocalState {
  counter: number;
  counterMax?: number;
  countingStopped: boolean;
  // derived properties
  square: number;
  fraction: number;
  percent: number;
}
...
@Component({
  ...
  providers: [StateService],
  ...
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

## Configuration of the State Service

State service can be configured by the following parameters:

| Option             | Description                                                                                                                    | Default        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| _enableDevTools_   | If true, [Redux DevTools](https://github.com/reduxjs/redux-devtools) browser extension is enabled to inspect changes of state. | `false`        |
| _enableConsoleLog_ | If true, changes of state are logged to console.                                                                               | `false`        |
| _enableStorage_    | If true, the latest state is persisted in storage and reloaded if changed to true.                                             | `false`        |
| _storage_          | Storage for persisting the state. Either `localStorage` or `sessionStorage`.                                                   | `localStorage` |
| _stateName_        | The name of the state used in Redux DevTools, console log and also as the key for storage.                                     | `'STATE_'<id>` |

To change the default service configuration, use `config` metod with a set of
changed parameters. It is usually called in component constructor or in
`ngOnInitOnInit` callback, but it's calling is not restricted to these places.

```ts
localState.config({
  enableStorage: true,
  enableConsoleLog: true,
  name: "TodoList",
});
```

## Usage

### Updating state

Arbitrary subset of state top-level properties can be set by the `set` method.

```ts
this.localState.set({ counterMax: 10 });
```

In the case of nested state (where properties of a state are objects
themselves), updating of inner properties require setting of `isDeep` option to
`true` or use of `setDeep` method instead.

```ts
interface LocalState {
  a: number;
  b?: string[];
  c: { d: boolean; e: string };
}

// initial state
this.localState.set({ a: 1, c: { d: false, e: "x" } });

// isDeep option set to true
this.localState.set({ c: { e: "y" } }, { isDeep: true });
// or
this.localState.setDeep({ c: { e: "y" } });

console.log(this.localState.value);
// prints: { a:1, c: { d: false, e: 'y' }}
```

If updating a state uses its current value it is convenient to use the variants
with functional parameters.

```ts
this.localState.set((state) => ({ a: state.a + 1 }));

this.localState.setDeep((state) => ({ c: { d: !state.c.d } }));
```

Setting a state can optionally specify also the `actionName` option which is
used in Redux DevTools and/or console log to identify domain-specific
method/purpose for updating the state. If not specified, `'set'` is used by
default.

```ts
this.localState.set((state) => ({ a: state.a + 1 }), { actionName: "increment" });
```

### Getting the current state

The current state is available in te `value` property of `StateService`.

```ts
this.localState.value.counterMax;
```

### Observing the changes of state

It is possible to subscribe for changes of a state through the `value$`
**Observervable**.

```html
@if (localState.value$ | async; as state) { ...
<div>{{ state.countingStopped ? "STOPPED" : state.counter }}</div>
@if (!!state.counterMax) {
<div class="progress" role="progressbar">
  <div class="progress-bar" [ngStyle]="{ width: state.counterPercent + '%' }">{{ state.counterPercent | number : ".0-0" }}%</div>
</div>
} ... }
```

You can also use the `*gnIf` directive instead of `@if` for older versions of
Angular (older versions of template syntax).

```html
<ng-container *ngIf="localState.value$ | async as state"> ... </ng-container>
```

Another possibility is to access the state changes by **Signal** propagated by
the `valueSignal` property.

```ts
stateSignal = this.localState.valueSignal;
```

Signal is then used in template.

```html
{{ stateSignal().counter }}
```

Usage of Observables or/and signals is typical for component templates with
`OnPush` change detection strategy.

### Observing sub-states and derived states

It is possible to subscribe for changes of a sub-state and also to modify the
state to a completely different object type. This is achieved by the `select`
method which can be used to slice complex states and/or to compute derived
values.

```ts
// compute derived properties propagated as Observable
const localExtendedState$ = this.localState.select((st) => {
  const fraction = st.counterMax ? st.counter / st.counterMax : 0;
  return {
    ...st,
    square: st.counter * st.counter,
    fraction,
    percent: 100 * fraction,
  };
});
```

Only different values are emitted. Comparing of previous and current values can
be controlled by the optional `comparator` parameter. If unspecified, objects
are compared by Lodash isEqual method.

For state chages propagated by signals, the `computed` Angular function can be
used to transform the state to a single value, slice or object of different
type.

```ts
counter: Signal<number>;
...
// selection of one property from localState propagated as signal
this.counter = computed(() => this.localState.valueSignal().counter);
```

## Global application state

### Defining global state service

The library itself does not provide a global state, but it can be defined as a
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

For convenient accessing of the state properties or for querying the state from
other parts of the application, the service can provide also domain-specific
methods. In this case, `getUser`, `setUser`, `getRoles`, `hasRole`, `addRoles`,
etc.

One application can provide more than one independent global state services.

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
to avoid cascading @if statements. `ngx-state-service` provides a utility
function `compose` for combining Observables from various states to one.

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
    this.state$ = compose(localState.value$, globalState.value$);
    ...
  }
}
```

Then just use the `state$` Observable to subscribe for changes of either local
or global state containing all unified state properties.

```ts
@if (state$ | async; as state) {
  <!-- accessing global state -->
  {{state.user}}
  <!-- accessing local state -->
  {{state.counter}}
}
```

Combining states in the signal way is even simpler. Just use standard Angular
`computed` function.

```ts
...
export class CalculatorComponent {
  state: Signal<UnifiedState>;

  constructor(
    private localState: StateService<LocalState>,
    private globalState: GlobalStateService
  ) {
    // define unified state
    this.state = computed(() => ({
      ...globalState.valueSignal(),
      ...localState.valueSignal(),
    }));

...
  }
}
```

## Utilities

The library contains also the following utilities:

- definition of `RecursivePartial` generics type discussed [here](https://stackoverflow.com/questions/41980195/recursive-partialt-in-typescript),
- function `mut` (for "mutate") used to create a shallow copy of an object with
  changed properties,
- function `mutDeep` used to create a deep copy of an object with recursively
  changed nested properties, and
- function `compose` used to unify Observables; described above.

`mut` and `mutDeep` functions are usually used for immutable changes of objects applied, for example, to change inputs of `OnPush` components.

```ts
let obj = { a: 1, b: { c: 1, d: 1 } };

obj = mut(obj, { a: 2 });
// obj is { a: 2, b: { c: 1, d: 1 } }

obj = mut(obj, { b: { c: 2 } });
// obj is { a: 2, b: { c: 2 } }

obj = mutDeep(obj, { b: { d: 2 } });
// obj is { a: 2, b: { c: 2, d: 2 } }
```

## Building and publishing the library

```console
ng build ngx-state-service
cd dist/ngx-state-service
npm publish
```

## Demo project

[Here](projects/demo) you can find a demo project. See it running on
[StackBlitz](https://stackblitz.com/~/github.com/Rado-1/ngx-state-service).
