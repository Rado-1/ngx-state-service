# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic
Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2024-06-13

### Fixed

- Fixed updating of state value if propagation is disabled by setting.

## [1.0.3] - 2024-06-12

### Added

- New `StateSettingOptions.propagate` option disabling propagation of state
  changing.

## [1.0.2] - 2024-03-26

### Fixed

- Resolving a security concern identified at
  [GHSA-wr3j-pwj9-hqq6](https://github.com/advisories/GHSA-wr3j-pwj9-hqq6).
- Improved test coverage (100% now).

## [1.0.1] - 2024-03-10

### Added

- New `StateService.valueSignal` property propagates changes of state as signal.
- New calculator demo for usage of signals.

### Changed

- Option `isDeep` removed from `StateSettingOptions`.
- `set` uses `Partial<T>` type for `statusUpdate` parameter now.
- `mut` uses `Partial<T>` type for `props` parameter now.

### Fixed

- Fixed generics in signatures of `set`, `setDeep`, `mut` and `mutDeep`.

## [0.4.0] - 2024-02-15

### Added

- Configuration of `StateService` set by new `config` method.
- Persisting state to storage.
- Support for Redux DevTools.
- Console logging.
- New `removeStoredState` method added to `StateService`.

### Changed

- Boolean parameter `isDeep` was replaced by object parameter `options` in `set`
  method.
- Object parameter `options` was added to `setDeep` method.

### Fixed

- Fix "New todo" button enabling in the demo project.

## [0.3.0] - 2024-02-07

### Added

- `compose` function added to utilities.
- Added tests for `compose` function.

## [0.2.1] - 2024-02-05

### Changed

- `select` method does not support `'==='` comparator anymore.
- `select` method uses as default comparator Lodash isEqual check.
- Demo project: simplified computation of derived state values.
- README.md updated.

## [0.1.5] - 2024-02-02

### Added

- `select` method was added to `StateService`.

### Removed

- `setFnc` and `setDeepFnc` methods were removed. Functional parameters are
  supported by `set` and `setDeep` methods now.

## [0.1.4] - 2024-01-31

### Changed

- Updated peer dependencies from Angular 17 to Angular 14.

## [0.1.3] - 2024-01-30

### Fixed

- Return types of `mut` and `mutDeep` functions.

## [0.1.2] - 2024-01-29

### Added

- First prerelease version.
