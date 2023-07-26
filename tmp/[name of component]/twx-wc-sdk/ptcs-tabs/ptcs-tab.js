import {PTCS} from 'ptcs-library/library.js';
import {TabElement} from '@vaadin/vaadin-tabs/src/vaadin-tab.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';

const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="ptcs-tab-default-theme" theme-for="vaadin-tab ptcs-tab">
  <template>
    <style>
      :host {
        display: flex;
        align-items: center;
        outline: none;
        padding: 48px 0;
        box-sizing: border-box;
        flex-shrink: 0;

        color: #1675be;
        color: var(--ptcs-text-color, #1675be);
      }

      :host([hidden]) {
        display: none !important;
      }

      :host([disabled]) {
        pointer-events: none;
        color: #cccccc;
        color: var(--ptcs-text-color__disabled, #cccccc);
      }

      :host([focus-ring]) {
        background-color: rgba(0, 0, 0, 0.1);
      }

    </style>
  </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);

PTCS.Tab = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(TabElement)) {
    static get is() {
        return 'ptcs-tab';
    }

    ready() {
        super.ready();
        this.tooltipFunc = this._monitorTooltip.bind(this);
        this.focusNoClipping = true; // Want a full focus rect around the tab
        this.addEventListener('focus', this._focusEv.bind(this));
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.parentNode.disabled) { // When tabs are initialized in disabled
            const tabNumber = this.getAttribute('tab-number') - 1;
            this.setAttribute('tabindex', tabNumber === this.parentElement.selected ? '0' : '-1');
        }
    }

    _monitorTooltip() { // Implements ptcs-tab's tooltip behavior on tab name truncation
        const el = this.firstElementChild; // ptcs-label in slotted content
        if (el && typeof el.tooltipFunc === 'function') { // Does the container have a function to deliver the tooltip contents?
            return el.tooltipFunc() || '';
        }
        return '';
    }

    _focusEv(ev) {
        const tabNumber = +this.getAttribute('tab-number');
        if (!isNaN(tabNumber)) {
            this.dispatchEvent(new CustomEvent('tab-focus', {
                bubbles:  true, composed: true,
                detail:   {selected: tabNumber - 1}
            }));
        }
    }

};

customElements.define(PTCS.Tab.is, PTCS.Tab);
