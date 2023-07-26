# Compile Parts Configuration

NOTE: This functionality is obsolete. The SDK no longer uses the Shady DOM polyfill.

In order to properly convert the styling information in ptcs-style-unit's to shady dom the conversion engine needs a _parts configuration database_. This database can be compiled from the component meta information in the _Theme Designer_.

The compilation process is executed from the root folder of `twx-visual-sdk` with the command:
~~~js
npm run compile-partmap
~~~

The Theme Designer resides in the `tw-theme-engine` repo. The compile process needs to get the path to this repo. The default location is `../tw-theme-engine`, i.e. in the same parent folder as `twx-visual-sdk`.

If `tw-theme-engine` is elsewhere the compilation process needs the actual path. Unfortunately, due to limitations in `yarn`, this path cannot be supplied as an argument to the script. Instead you need to edit the variable `twThemeRepo` in `src/utils/ptcs-style-unit/compile-parts.js`.

The part configuration database only needs to be recompiled when the _meta information_ has changed for a component, _not_ when the themeing / styling changes.