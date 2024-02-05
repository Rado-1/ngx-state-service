# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2024-02-02

### Changed

- `select` method does not support `'==='` comparator anymore
- `select` method uses as default comparator Lodash isEqual check
- Demo project: simplified computation of derived state values
- README.md updated

## [0.1.5] - 2024-02-02

### Added

- `select` method was added to `StateService`

### Removed

- `setFnc` and `setDeepFnc` methods were removed. Functional parameters are now
  supported by `set` and `setDeep` functions

## [0.1.4] - 2024-01-31

### Changed

- Updated peer dependencies from Angular 17 to Angular 14

## [0.1.3] - 2024-01-30

### Fixed

- Return types of `mut` and `mutDeep` functions

## [0.1.2] - 2024-01-29

### Added

- First prerelease version
