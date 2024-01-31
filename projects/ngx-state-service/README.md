# ngx-state-service

Lightweight state management library for Angular.

:warning: **This version is still work in progress used to get feedback from
community. It is not recommended to use it in "real" projects yet, since API can
change if requested by users. I expect to stabilize the API until March 2024.**

## Compatibility with Angular versions

Angular `14.0.0` or higher is required.

## About

**ngx-state-service** provides much simpler approach than other robust state
management libraries, like [ngrx](https://ngrx.io/) or
[ngxs](https://www.ngxs.io/), and is intended for developers who need
straightforward, type safe, effective, and practically usable solution with
minimal boilerplate.

Even if the primary motivation was to solve the problem of local
component state for OnPush change detection strategy seamlessly propagated to
component template, the library can be used also for managing global application
state shared among components.

## Additional info

For documentation and demo see the project's [GitHub
repository](https://github.com/Rado-1/ngx-state-service).
