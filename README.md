# workpop-base

A base module to write new NPM Modules

## Basic Usage

* Simply clone the project.
* Change the `package.json` as you want.
* Then publish to npm via `npm publish`.

## Linting

* ESLINT support is added to the project.
* Use `npm run lint` to lint your code and `npm run fix` to fix common issues.

## Testing

* You can write test under `test` directory.
* Then run `npm test` to test your code. (It'll lint your code as well).
* You can also run `npm run testonly` to run tests without linting.

## ES2015 Setup

* ES2015 support is added with babel6.
* You can change them with adding and removing [presets](http://jamesknelson.com/the-six-things-you-need-to-know-about-babel-6/).
* All the polyfills you use are taken from the local `babel-runtime` package. So, this package won't add any global polyfills and pollute the global namespace.
