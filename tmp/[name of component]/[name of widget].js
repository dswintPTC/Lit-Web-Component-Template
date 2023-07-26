import {LitElement, html, css} from 'lit';
import {PTCS} from 'ptcs-library/library.js';

class SimpleEl extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
      }

      #header {
        color: green;
      }

      ptcs-label {
        display: block;
        padding-bottom: 10px;
      }
    `;
  }
  
  //Properties can be String, Boolean, Number, Array or Object
  static get properties() {
    return {
      myName: {
        type: String
      },

      framework: {
        type: String
      }
    };
  }

  constructor() {
    super();
    this.myName = 'simple-el';
    this.framework = 'Lit';
  }

  static get is() {
    return 'simple-el';
  }

  render() {
    return html`
      <h1 id="header">Hello ${this.myName}!</h1>
      <ptcs-label .label="And welcome ${this.framework}!"></ptcs-label>
      <ptcs-button label="PTCS button" @click=${this._handleClick}></ptcs-button>
    `;
  }

  foo() {
    console.log('simple-el:::foo');
  }

  _handleClick() {
    console.log('Clicked!');
  }
}

window.customElements.define(SimpleEl.is, SimpleEl);