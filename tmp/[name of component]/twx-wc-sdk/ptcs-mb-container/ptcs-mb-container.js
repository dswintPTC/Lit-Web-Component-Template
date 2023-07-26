import {LitElement} from 'lit';
import {L2Pw} from 'ptcs-library/library-lit';
import {PTCS} from 'ptcs-library/library.js';
import {BehaviorLazy} from 'ptcs-lazy/ptcs-behavior-lazy.js';

const isIDE = () => !!(window.TW.IDE && window.TW.IDE.Widgets);

/**
 *
 * @class MbContainer
 * @extends {Polymer.Element|HTMLElement}
 * @memberof PTCS
 */
export const MbContainer = class extends BehaviorLazy(L2Pw(LitElement)) {
    static get is() {
        return 'ptcs-mb-container';
    }

    static get properties() {
        return {
            subWidgetContainerId: {
                type:      String,
                reflect:   true,
                attribute: 'sub-widget-container-id'
            },

            subWidget: {
                type:      Number,
                reflect:   true,
                attribute: 'sub-widget'
            },

            disabled: {
                reflect:  true,
                value:    false,
                observer: '_disabled'
            },

            // Should the container control its own size?
            flex: {
                type:    Boolean,
                value:   false,
                reflect: true
            },
        };
    }

    createRenderRoot() {
        return this;
    }

    _disabled(val) {
        this.style.opacity = val ? 0.5 : '';
        this.style.pointerEvents = val ? 'none' : '';
    }

    /** @type {TW.Runtime.Widget.flexcontainer} */
    __containerWidget;

    get shouldLazyLoad() {
        return !isIDE() && this.__containerWidget.getProperty('LazyLoading');
    }

    get shouldReload() {
        return false;
    }

    get shouldUnload() {
        return !isIDE() && this.__containerWidget.getProperty('EnableContainerUnload');
    }

    async init() {
        return this._initFromChild(await PTCS.waitForChild(this));
    }

    /**
     *
     * @param {HTMLElement} child
     */
    async _initFromChild(child) {
        if (!(child.nodeType === Node.ELEMENT_NODE && child.classList.contains('widget-bounding-box'))) {
            throw new Error('Expected a widget-bounding-box element');
        }

        const widgetElement = await PTCS.waitForChild(child, ':scope > .widget-content.widget-container');
        this.__containerWidget = window.$(widgetElement).data('widget');
    }

    async realLoad() {
        if (this.__containerWidget._loadContainer) {
            const p = PTCS.waitForJqueryTrigger(this.__containerWidget.jqElement, 'Loaded');
            this.__containerWidget._loadContainer();
            await p;
        }
    }

    async realUnload() {
        if (this.__containerWidget._unloadContainer) {
            const p = PTCS.waitForJqueryTrigger(this.__containerWidget.jqElement, 'Unloaded');
            this.__containerWidget._unloadContainer();
            await p;
        }
    }
};

PTCS.MbContainer = MbContainer;
customElements.define(MbContainer.is, MbContainer);
