# ngx-state-service

Yet another lightweight state management library for Angular.

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
interface, and therefore takes all advantages of TypeScript type system.
StateService allows to modify arbitrary part of the state (properties) at once.
In addition, the state can represent a nested structures which can be modified
at arbitrary level of nesting. This provides possibility to logically structure
state by user's needs.

Internally, a state is represented by immutable object of which changes are
propagated to other parts of application as rsjx Observables. Another
possibility is to read the current status of state by getter. This allows
effective usage of state in component templates, including OnPush change
detection strategy.

## Compatibility with Angular versions

Angular `14.0.0` or higher is required. However, the source code can be compiled
on older version of Angular, starting from Angular 5.

## Installation

```
npm i ngx-state-service
```

## Initial setup

In standalone component, you just define the local state interface and inject
the service. The service is parametrized with the state interface.

```ts
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StateService } from "ngx-state-service";

interface LocalState {
  counter: number;
}

@Component({
  selector: "app-component",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
  providers: [StateService],
})
export class AppComponent {
  constructor(public state: StateService<LocalState>) {}
}
```

In not-standalone component, omit `standalone`, `imports`, and `providers`
properties from the component config.

---

## Code scaffolding

Run `ng generate component component-name --project ngx-state-service` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project ngx-state-service`.

> Note: Don't forget to add `--project ngx-state-service` or else it will be added to the default project in your `angular.json` file.

## Build

Run `ng build ngx-state-service` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build ngx-state-service`, go to the dist folder `cd dist/ngx-state-service` and run `npm publish`.

## Running unit tests

Run `ng test ngx-state-service` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
