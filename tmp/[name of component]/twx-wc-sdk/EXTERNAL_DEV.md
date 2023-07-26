# Developing Polymer Web Components Outside of PTC

If you are an external developer you can also use ptcs modules in your own web components.

## Install
- Get an archived set of ptcs components named _twx-wc-sdk-[VERSION].zip_
- Extract zip content to _twx-wc-sdk_ folder inside your project
- Install our components and their dependencies by
```
  npm install ./twx-wc-sdk/ptcs-library
```
- As a result you will see symbolic links of ptcs components inside your _node_modules_ folder
- You can add your own dependencies for the project like *@polymer/paper-button*
- **You can't add dependencies for @polymer/polymer and @webcomponents** to your package.json file. Otherwise they will conflict with the same dependencies installed by ptcs-library.
## Development
- In your component's code you can use js imports to ptcs components:
```
  import 'ptcs-button/ptcs-button.js';
```
- To have ptcs base style in your demo page add:
```
  <script type="module" src="../node_modules/ptcs-base-theme/ptcs-base-theme.js"></script>
```
- To load Edge polyfills in your demo page add:
```
  <script src="../node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js"></script>
```
## mub
- You don't need to have .npmrc file unless you want to specify some general dependencies under widgets.json and these dependencies require it
- Before running *mub*:
  - Create *tmp* folder next to the *input* folder
  - Copy your component folder to the *tmp* folder. **Don't copy node_modules!**
  - *htmlImports* of the json file of your widget should specify the file location of your component:
  ```
  "htmlImports": [
    {
      "from": "npm",
      "id": "simple-el",
      "version": "file:simple-el",
      "url": "simple-el/simple-el.js"
    }
  ]
  ```
