import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-icon/ptcs-icon.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import 'ptcs-icons/cds-icons.js';

/* eslint-disable max-len */

PTCS.DynamicPanel = class extends PTCS.BehaviorTabindex(PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))))) {
    static get template() {
        return html`
        <style>
        :host {
            /* If not relative then the collapsed panel will not be hidden in fly-over mode. MB tries to change position to static */
            position: relative !important;
            display: flex;
            flex-wrap: nowrap;
            justify-content: space-between;
            align-items: stretch;
            align-content: stretch;
            box-sizing: border-box;
            overflow: hidden;
            width: 100%;
            height: 100%;
            outline: none;
        }

        :host([sizing]) {
            user-select: none;
            -ms-user-select: none;
        }

        :host([sizing]) ::slotted(*) {
            user-select: none;
            -ms-user-select: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            -khtml-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }

        :host([anchor=top]) {
            flex-direction: column;
        }

        :host([anchor=right]) {
            flex-direction: row-reverse;
        }

        :host([anchor=bottom]) {
            flex-direction: column-reverse;
        }

        :host([anchor=left]) {
            flex-direction: row;
        }

        .panel-cntr {
            position: relative;
            display: flex;
            flex-wrap: nowrap;
            justify-content: space-between;
            align-items: stretch;
            align-content: stretch;
            flex: 0 0 auto;
            background: inherit;
        }

        :host([transition][panel-size=auto]) .panel-cntr,
        :host([transition]:not([panel-size])) .panel-cntr {
            overflow: hidden;
        }

        .panel-cntr[mode=flyover] {
            position: absolute;
            z-index: 20000;
        }

        :host([anchor=top]) > .panel-cntr {
            flex-direction: column;
        }

        :host([anchor=right]) > .panel-cntr {
            flex-direction: row-reverse;
        }

        :host([anchor=bottom]) > .panel-cntr {
            flex-direction: column-reverse;
        }

        :host([anchor=left]) > .panel-cntr {
            flex-direction: row;
        }

        .panel-cntr[tuck] {
            justify-content: flex-end;
        }

        /* IE fix */
        :host([ie-fix]) .panel-cntr[tuck] {
            overflow: hidden;
        }

        [part~=panel] {
            position: relative;
            box-sizing: border-box;
            overflow: auto;
        }

        .panel-cntr:not([tuck]) [part~=panel] {
            flex: 1 1 auto;
        }

        .panel-cntr[tuck] [part~=panel] {
            flex: 0 0 auto;
        }

        .container-wrapper {
            display: flex;
            position: relative;
            flex: 1 1 auto;
            box-sizing: border-box;
            overflow: hidden;
        }

        :host([variant=reveal]) .container-wrapper {
            flex: 0 0 auto;
        }

        :host([variant=reveal]:not([collapsed])) .panel-cntr {
            flex: 1 0 auto;
        }

        :host([variant=reveal][collapsed]) [part~=panel] {
            display: none;
        }

        :host([variant=reveal]) .panel-cntr {
            overflow: hidden;
        }

        [part~=scrim] {
            position: absolute;
            box-sizing: border-box;
            left: 0px;
            top: 0px;
            right: 0px;
            bottom: 0px;
            z-index: 2000;
        }

        [part~=container] {
            position: relative;
            width: 100%;
            box-sizing: border-box;
            overflow: auto;
            background: inherit;
        }

        :host([variant=reveal]) [part=container] {
            display: flex;
        }

        :host([variant=reveal][toggle-icon-side=right]) [part=container] {
            flex-direction: row-reverse;
        }

        :host([variant=reveal]) [part=panel-wrapper] {
            width: 100%;
            height: 100%;
        }

        :host([variant~=reveal]:not([collapsed])) [part~=state-button] {
            transform: rotate(90deg);
        }

        :host([variant=reveal]) {
            width: auto;
            height: auto;
            justify-content: flex-end;
        }

        :host([variant=reveal]) .hitarea {
            cursor: default !important;
            pointer-events: none;
        }

        :host([variant=reveal]) .container-wrapper {
            height: var(--ptcs-dynamic-panel--header-height, auto);
        }

        :host([variant=reveal]:not([collapsed])) #panelcntr {
            min-height: var(--ptcs-dynamic-panel--body-min-height, auto);
            max-height: var(--ptcs-dynamic-panel--body-max-height, auto);
        }

        :host([collapsed]) [part~=separator] {
            pointer-events: none;
        }

        [part~=separator] {
            position: relative;
            flex: 0 0 auto;
        }

        .hitarea {
            position: absolute;
            z-index: 20000;
        }

        :host([collapsed]) .hitarea {
            display: none;
        }

        [part~=separator][anchor=left] .hitarea {
            width: 20px;
            top: 0px;
            bottom: 0px;
            right: calc(50% - 10px);
            cursor: ew-resize;
        }

        [part~=separator][anchor=right] .hitarea {
            width: 20px;
            top: 0px;
            bottom: 0px;
            left: calc(50% - 10px);
            cursor: ew-resize;
        }

        [part~=separator][anchor=top] .hitarea {
            height: 20px;
            bottom: calc(50% - 10px);
            left: 0px;
            right: 0px;
            cursor: ns-resize;
        }

        [part~=separator][anchor=bottom] .hitarea {
            height: 20px;
            top: calc(50% - 10px);
            left: 0px;
            right: 0px;
            cursor: ns-resize;
        }

        :host([hide-thumb]) .hitarea {
            cursor: default !important;
            pointer-events: none;
        }

        [part~=thumb] {
            position: absolute;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            fill: currentColor;
        }

        :host([hide-thumb]) [part~=thumb] {
            display: none;
        }

        :host([transition]) .hitarea {
            display: none !important;
        }

        [part~=trigger][hidden] {
            display: none;
        }

        [part~=trigger] {
            position: absolute;
            box-sizing: border-box;
            cursor: pointer;
            z-index: 20000;
            display: flex;
            align-items: center;
            justify-content: center;
        }


        /*
         * Shady DOM fix: "> div > div >" - or the styling leaks into sub-dynamic-panels
         */

        :host([collapsed]) > div > div > [part~=trigger]:not(.reflex) {
            opacity: 0;
            pointer-events: none;
        }
        :host(:not([collapsed])) > div > div > .reflex[part~=trigger] {
            opacity: 0;
            pointer-events: none;
        }

        :host([anchor=left]) > div > div > [part~=trigger][pos=top] {
            top: 0px;
            right: 0px;
        }
        :host([anchor=left]) > div > div > [part~=trigger][pos=center] {
            top: calc(50% - 17px);
            right: 0px;
        }
        :host([anchor=left]) > div > div > [part~=trigger][pos=bottom] {
            bottom: 0px;
            right: 0px;
        }
        :host([anchor=right]) > div > div > [part~=trigger][pos=top] {
            top: 0px;
            left: 0px;
        }
        :host([anchor=right]) > div > div > [part~=trigger][pos=center] {
            top: calc(50% - 17px);
            left: 0px;
        }
        :host([anchor=right]) > div > div > [part~=trigger][pos=bottom] {
            bottom: 0px;
            left: 0px;
        }
        :host([anchor=top]) > div > div > [part~=trigger][pos=left] {
            bottom: 0px;
            left: 0px;
        }
        :host([anchor=top]) > div > div > [part~=trigger][pos=center] {
            bottom: 0px;
            left: calc(50% - 17px);
        }
        :host([anchor=top]) > div > div > [part~=trigger][pos=right] {
            bottom: 0px;
            right: 0px;
        }
        :host([anchor=bottom]) > div > div > [part~=trigger][pos=left] {
            top: 0px;
            left: 0px;
        }
        :host([anchor=bottom]) > div > div > [part~=trigger][pos=center] {
            top: 0px;
            left: calc(50% - 17px);
        }
        :host([anchor=bottom]) > div > div > [part~=trigger][pos=right] {
            top: 0px;
            right: 0px;
        }

        /* Reflex trigger */
        :host([anchor=left]) > div > div > .reflex[part~=trigger][pos=top] {
            right: unset;
            left: 0px;
        }
        :host([anchor=left]) > div > div > .reflex[part~=trigger][pos=center] {
            right: unset;
            left: 0px;
        }
        :host([anchor=left]) > div > div > .reflex[part~=trigger][pos=bottom] {
            right: unset;
            left: 0px;
        }
        :host([anchor=right]) > div > div > .reflex[part~=trigger][pos=top] {
            left: unset;
            right: 0px;
        }
        :host([anchor=right]) > div > div > .reflex[part~=trigger][pos=center] {
            left: unset;
            right: 0px;
        }
        :host([anchor=right]) > div > div > .reflex[part~=trigger][pos=bottom] {
            left: unset;
            right: 0px;
        }
        :host([anchor=top]) > div > div > .reflex[part~=trigger][pos=left] {
            bottom: unset;
            top: 0px;
        }
        :host([anchor=top]) > div > div > .reflex[part~=trigger][pos=center] {
            bottom: unset;
            top: 0px;
        }
        :host([anchor=top]) > div > div > .reflex[part~=trigger][pos=right] {
            bottom: unset;
            top: 0px;
        }
        :host([anchor=bottom]) > div > div > .reflex[part~=trigger][pos=left] {
            top: unset;
            bottom: 0px;
        }
        :host([anchor=bottom]) > div > div > .reflex[part~=trigger][pos=center] {
            top: unset;
            bottom: 0px;
        }
        :host([anchor=bottom]) > div > div > .reflex[part~=trigger][pos=right] {
            top: unset;
            bottom: 0px;
        }

        /* Icons */
        :host([anchor=left][trigger-type=type1]) > div > div > [part~=trigger] {
            transform: rotate(0deg);
        }
        :host([anchor=left][trigger-type=type1]) > div > div > .reflex[part~=trigger] {
            transform: rotate(180deg);
        }
        :host([anchor=right][trigger-type=type1]) > div > div > [part~=trigger] {
            transform: rotate(180deg);
        }
        :host([anchor=right][trigger-type=type1]) > div > div > .reflex[part~=trigger] {
            transform: rotate(0deg);
        }
        :host([anchor=top][trigger-type=type1]) > div > div > [part~=trigger] {
            transform: rotate(90deg);
        }
        :host([anchor=top][trigger-type=type1]) > div > div > .reflex[part~=trigger] {
            transform: rotate(-90deg);
        }
        :host([anchor=bottom][trigger-type=type1]) > div > div > [part~=trigger] {
            transform: rotate(-90deg);
        }
        :host([anchor=bottom][trigger-type=type1]) > div > div > .reflex[part~=trigger] {
            transform: rotate(90deg);
        }

        :host([anchor=left][trigger-type=type2]) > div > div > .reflex[part~=trigger] {
            transform: rotate(180deg);
        }
        :host([anchor=right][trigger-type=type2]) > div > div > .reflex[part~=trigger] {
            transform: rotate(0deg);
        }
        :host([anchor=top][trigger-type=type2]) > div > div > .reflex[part~=trigger] {
            transform: rotate(-90deg);
        }
        :host([anchor=bottom][trigger-type=type2]) > div > div > .reflex[part~=trigger] {
            transform: rotate(90deg);
        }

        :host([anchor=left][trigger-type=type3]) > div > div > [part~=trigger]:not(.reflex) {
            transform: rotate(0deg);
        }
        :host([anchor=right][trigger-type=type3]) > div > div > [part~=trigger]:not(.reflex) {
            transform: rotate(180deg);
        }
        :host([anchor=top][trigger-type=type3]) > div > div > [part~=trigger]:not(.reflex) {
            transform: rotate(90deg);
        }
        :host([anchor=bottom][trigger-type=type3]) > div > div > [part~=trigger]:not(.reflex) {
            transform: rotate(-90deg);
        }

        :host([anchor=left][trigger-type=type3]) > div > div > .reflex[part~=trigger] {
            transform: rotate(180deg);
        }

        :host([anchor=right][trigger-type=type3]) > div > div > .reflex[part~=trigger] {
            transform: rotate(0deg);
        }

        :host([anchor=top][trigger-type=type3]) > div > div > .reflex[part~=trigger] {
            transform: rotate(-90deg);
        }

        :host([anchor=bottom][trigger-type=type3]) > div > div > .reflex[part~=trigger] {
            transform: rotate(90deg);
        }

        .slot-wrapper:not([flex]) {
            position: absolute;
            top: 0px;
            left: 0px;
            right: 0px;
            bottom: 0px;
            overflow: auto;
        }

        :host([collapsed]:not([transition])) .panel-cntr [part=panel-wrapper] {
            display: none; /* Prevent hidden elements to get focus */
        }
        </style>

        <div id="panelcntr" class="panel-cntr" mode\$="[[pushBehavior]]" tuck\$="[[_tuck(transition, _collapsed)]]"
            on-transitionstart="_transitionStart" on-transitioncancel="_transitionCancel" on-transitionend="_transitionEnd">
            <div id="panel" part="panel">
                <div id="trigger" part="trigger" on-click="_toggleClick" hidden\$="[[_hideTrigger(_trigger)]]" pos\$="[[_trigger]]">
                    <ptcs-button no-tabindex id="triggerbutton" part="trigger-button" variant="small" icon="[[_triggerIcon1(triggerType)]]"
                                 tooltip="[[triggerTooltip]]" tooltip-icon="[[triggerTooltipIcon]]"></ptcs-button>
                </div>
                <div part="panel-wrapper" class="slot-wrapper" flex\$="[[_useFlex(flex, variant)]]"><slot name="panel"></slot></div>
            </div>
            <div id="separator" part="separator" anchor\$="[[anchor]]" hover\$="[[hoverThumb]]">
                <div class="hitarea" on-mouseenter="_mouseEnter" on-mouseleave="_mouseLeave"
                     tooltip="[[thumbTooltip]]" tooltip-icon="[[thumbTooltipIcon]]"><div id="thumb" part="thumb" anchor\$="[[anchor]]" hover\$="[[hoverThumb]]">
                <svg width="11px" height="8px" viewBox="0 0 11 8">
                    <g stroke="none" stroke-width="1" transform="translate(5.5, 4) rotate(-90) translate(-3.5, -5)">
                        <path d="M1.02508179,5.83333333 L0,6.8125 L3.32969829,10 L6.66666667,6.8125 L5.63431479,5.83333333 L3.32969829,8.03472222 L1.02508179,5.83333333 Z M5.64158488,4.16666667 L6.66666667,3.1875 L3.33696838,0 L0,3.1875 L1.03235187,4.16666667 L3.33696838,1.96527778 L5.64158488,4.16666667 Z"></path>
                    </g>
                </svg></div></div>
            </div>
        </div>
        <div id="containerwrapper" class="container-wrapper">
            <div part="scrim" id="scrim" hidden\$="[[_hideScrim(scrim, _collapsed)]]"></div>
            <div id="container" part="container" on-click="_cntrClick">
                <div part="state-indicator" id="stateindicator" hidden\$="[[_hideStateIndicator(variant)]]">
                    <ptcs-button no-tabindex id="statebutton" part="state-button" variant="tertiary"
                        on-click="_stateButtonClick" icon="[[_triggerIconReveal(toggleButtonIcon)]]"
                        tooltip="[[triggerTooltip]]" tooltip-icon="[[triggerTooltipIcon]]" disabled="[[disabled]]"></ptcs-button>
                </div>
                <div id="trigger2" part="trigger" class="reflex" on-click="_toggleClick" hidden\$="[[_hideTrigger(_trigger)]]" pos\$="[[_trigger]]">
                    <ptcs-button no-tabindex id="triggerbutton2" part="trigger-button" variant="small" icon="[[_triggerIcon2(triggerType)]]"
                                 tooltip="[[triggerTooltip]]" tooltip-icon="[[triggerTooltipIcon]]"></ptcs-button>
                </div>
                <div part="panel-wrapper" class="slot-wrapper" flex\$="[[_useFlex(flex, variant)]]"><slot></slot></div>
             </div>
        </div>`;

    }

    static get is() {
        return 'ptcs-dynamic-panel';
    }

    static get properties() {
        return {
            disabled: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // "top", "right", "bottom", "left"
            anchor: {
                type:               String,
                value:              'left',
                reflectToAttribute: true
            },

            variant: {
                type:               String,
                value:              null,
                reflectToAttribute: true
            },

            toggleIconSide: {
                type:               String,
                value:              'left',
                reflectToAttribute: true
            },

            toggleButtonIcon: {
                type:  String,
                value: 'caret'
            },

            // Height of the header panel (in Reveal mode)
            headerPanelHeight: {
                type:  String,
                value: 'auto'
            },

            // Labe to use as the aria-label for the container (in Reveal mode)
            headerPanelLabel: {
                type:  String,
                value: null
            },

            bodyPanelMinHeight: {
                type:  String,
                value: 'auto'
            },

            bodyPanelMaxHeight: {
                type:  String,
                value: 'auto'
            },

            // Should the panel be expanded when loaded (in Reveal mode)
            expandedOnLoad: {
                type: Boolean
            },

            hideThumb: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // "top", "right", "bottom", "left", "center", "middle", "none", "panel"
            trigger: {
                type:  String,
                value: 'top'
            },
            triggerTooltip: {
                type: String
            },
            triggerTooltipIcon: {
                type: String
            },

            // "type1", "type2", "type3", "type4"
            triggerType: {
                type:               String,
                value:              'type1',
                reflectToAttribute: true
            },

            hideTrigger: {
                type: Boolean
            },

            // "top", "right", "bottom", "left", "center", "none", "panel"
            _trigger: {
                type:     String,
                computed: '_computeTrigger(trigger, anchor, hideTrigger, variant)'
            },

            collapsed: {
                type:               Boolean,
                value:              false,
                notify:             true,
                reflectToAttribute: true,
                observer:           '_collapsedChanged'
            },

            // Internal value, that allow us to do pre-work before starting the collapse / expand process
            _collapsed: {
                type: Boolean
            },

            // Saved panel height when panel is hidden,
            // so it can animate the expand process
            _hideSize: {
                type: String
            },

            // Is panel in transition? (collapsed property)
            transition: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // "push", "flyover"
            pushBehavior: {
                type:               String,
                value:              'push',
                reflectToAttribute: true
            },

            // Enable scrim
            scrim: {
                type: Boolean
            },

            collapsedPanelSize: {
                type:  String,
                value: '0px'
            },

            minPanelSize: {
                type:  String,
                value: '34px'
            },

            maxPanelSize: {
                type:  String,
                value: '100%'
            },

            panelSize: {
                type:               String,
                value:              '280px',
                observer:           '_panelSizeChanged',
                reflectToAttribute: true
            },

            // Is panelSize === 'auto' and the UI user has not yet
            // dragged the resize thumb?
            _autoPanel: {
                type: Boolean
            },

            // The actual panelSize
            _panelLength: {
                type:  String,
                value: '280px'
            },

            // Is the resize thumb currently dragged?
            sizing: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            speed: {
                type:  String,
                value: '200ms'
            },

            // Such an awkward name...
            clickOutsideToClose: {
                type: Boolean
            },

            disableOutsideClickForMashupIDE: {
                type:  Boolean,
                value: false
            },

            _connected: {
                type: Boolean
            },

            // Flex mode? (Probably = is the height of the component not "auto"?)
            flex: {
                type: Boolean
            },

            // Workaround for the theme engine to detect when the thumb is hovered via the hitarea
            hoverThumb: {
                type: Boolean
            },

            thumbTooltip: {
                type: String
            },
            thumbTooltipIcon: {
                type: String
            }
        };
    }

    static get observers() {
        return [
            '_panelLengthConfig(_panelLength, pushBehavior, anchor, _collapsed, collapsedPanelSize, variant)',
            '_minmaxSize(anchor, _collapsed, transition, minPanelSize, maxPanelSize, variant)',
            '_animationSpeed(speed, sizing)',
            '_clickOutsideToClose(clickOutsideToClose, _connected, _collapsed, disableOutsideClickForMashupIDE)',
            '_calcHeaderPanelHeight(headerPanelHeight, variant)',
            '_calcBodyPanelMinHeight(bodyPanelMinHeight, variant)',
            '_calcBodyPanelMaxHeight(bodyPanelMaxHeight, variant)'
        ];
    }

    ready() {
        super.ready();

        this.addEventListener('keydown', this._keyDown.bind(this));
        this.$.separator.addEventListener('touchstart', ev => this._mouseDown(ev, true));
        this.$.separator.addEventListener('mousedown', ev => this._mouseDown(ev));

        this._trackFocus(this, this._getFocus.bind(this));

        // If the expandedOnLoad property is set on load (in Reveal mode), then make sure the 'collapsed'
        // property is set accordingly
        if (this.variant === 'reveal' && this.expandedOnLoad) {
            this.collapsed = false;
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this._connected = true;

        if (this.flex === undefined) {
            const style = window.getComputedStyle(this);
            this.flex = (style.height === 'auto');
        }
    }

    disconnectedCallback() {
        this._connected = false;
        super.disconnectedCallback();
    }

    applyProps(style, opt) {
        for (const k in opt) {
            style[k] = opt[k];
        }
    }

    _useFlex(flex, variant) {
        return variant === 'reveal' || flex;
    }

    _tuck(transition, _collapsed) {
        return transition || _collapsed;
    }

    _hideScrim(scrim, _collapsed) {
        return !scrim || _collapsed;
    }

    _stateButtonClick(ev) {
        if (this.variant === 'reveal' && !this.disabled) {
            this.toggle();
        }
    }

    static _triggerType(triggerType) {
        return typeof triggerType === 'string' ? triggerType.replace(/\s/g, '').toLowerCase() : '';
    }

    _triggerIcon1(triggerType) {
        switch (PTCS.DynamicPanel._triggerType(triggerType)) {
            case 'type1':
            case 'doublecarets':
                return 'cds:icon_double_chevron_mini';
            case 'type2':
            case 'close':
                return 'cds:icon_close_mini';
            case 'type3':
            case 'singlecaret':
                return 'cds:icon_chevron_left_mini';
            case 'type4':
            case 'plus/minus':
                return 'cds:icon_minus_mini';
        }
        return false;
    }

    _triggerIcon2(triggerType) {
        switch (PTCS.DynamicPanel._triggerType(triggerType)) {
            case 'type1':
            case 'doublecarets':
                return 'cds:icon_double_chevron_mini';
            case 'type2':
            case 'close':
                return 'cds:icon_chevron_left_mini';
            case 'type3':
            case 'singlecaret':
                return 'cds:icon_chevron_left_mini';
            case 'type4':
            case 'plus/minus':
                return 'cds:icon_add_mini';
        }
        return false;
    }

    _triggerIconReveal(triggerType) {
        // Not all the icon types are suitable for the 'reveal' variant
        switch (PTCS.DynamicPanel._triggerType(triggerType)) {
            case 'triangle':
                return 'cds:icon_arrow_right_mini';
            default:
                return 'cds:icon_chevron_right_mini';
        }
    }

    _calcHeaderPanelHeight(headerPanelHeight, variant) {
        if (variant === 'reveal') {
            this.$.containerwrapper.style.setProperty(
                '--ptcs-dynamic-panel--header-height',
                PTCS.DynamicPanel._height(headerPanelHeight, 'auto'));
        }
    }

    _calcBodyPanelMinHeight(bodyPanelMinHeight, variant) {
        if (variant === 'reveal') {
            this.$.panelcntr.style.setProperty(
                '--ptcs-dynamic-panel--body-min-height',
                PTCS.DynamicPanel._height(bodyPanelMinHeight, 'auto'));
        }
    }

    _calcBodyPanelMaxHeight(bodyPanelMaxHeight, variant) {
        if (bodyPanelMaxHeight !== 'auto' && variant === 'reveal') {
            this.$.panelcntr.style.setProperty(
                '--ptcs-dynamic-panel--body-max-height',
                PTCS.DynamicPanel._height(bodyPanelMaxHeight, 'unset'));
        }
    }

    // Wrapper for _size that handles numbers and undefined as well
    static _height(height, defaultUndefined) {
        if (height === undefined) {
            return defaultUndefined;
        }
        return typeof height === 'number' ? `${height}px` : PTCS.DynamicPanel._size(height);
    }

    // Unit-less sizes should explicitly use the 'px' unit
    static _size(size) {
        const m = typeof size === 'string' ? /^([0-9.]+)(.*)$/.exec(size) : undefined;
        return m && m[2] === '' ? size + 'px' : size;
    }

    _getFocus() {
        if (this.variant === 'reveal') { // NOTE: variants should only be used for selecting styling, not behavior... (too late to fix now)
            // In the new 'reveal' variant, just highlight the button
            return this.$.statebutton;
        }

        // Focusable points: trigger and (resize) thumb
        const trigger = !this.hideTrigger && this.trigger !== 'none' && this.trigger !== 'panel' && (this.collapsed ? this.$.triggerbutton2 : this.$.triggerbutton);
        const thumb = !this.collapsed && !this.hideThumb && this.$.thumb;

        const focusEl = trigger || thumb || this; // Trigger, if visible, otherwise thumb. Worst case, focus border on entire panel
        if (focusEl === this) {
            this.style.setProperty('--ptcs-focus-overlay--padding', '0px');
        }
        return focusEl;
    }

    toggle() {
        this.collapsed = !this.collapsed;
    }

    _toggleClick() {
        if (!this.disabled) {
            this.toggle();
        }
    }

    _cntrClick() {
        if (this._trigger === 'panel' && !this.disabled) {
            this.toggle();
        }
    }

    _panelSizeChanged(panelSize) {
        if (panelSize === 'auto' || !panelSize) {
            if (this.variant !== 'reveal') {
                this.$.panel.style.overflow = 'hidden';
            }
            this.setProperties({
                _autoPanel:   true,
                _panelLength: 'auto'
            });
        } else {
            if (this.variant !== 'reveal') {
                this.$.panel.style.overflow = '';
            }
            this.setProperties({
                _autoPanel:   false,
                _panelLength: PTCS.DynamicPanel._size(panelSize)
            });
        }
    }

    _hideTrigger(_trigger) {
        return _trigger === 'none' || _trigger === 'panel';
    }

    _hideStateIndicator(variant) {
        if (variant === 'reveal') {
            return false;
        }
        return true;
    }

    _computeTrigger(trigger, anchor, hideTrigger, variant) {
        if (hideTrigger || variant === 'reveal') {
            return 'none';
        }
        if (trigger === 'none' || trigger === 'panel') {
            return trigger;
        }
        if (trigger === 'middle' || trigger === 'center') {
            return 'center';
        }
        if (anchor === 'left' || anchor === 'right') {
            if (trigger !== 'top' && trigger !== 'bottom') {
                return 'top';
            }
        } else if (anchor === 'top' || anchor === 'bottom') {
            if (trigger !== 'left' && trigger !== 'right') {
                return 'right';
            }
        }
        return trigger;
    }

    _panelLengthConfig(_panelLength, pushBehavior, anchor, _collapsed, collapsedPanelSize, variant) {
        const vert = anchor === 'left' || anchor === 'right';
        const style = this.$.panelcntr.style;
        const opt = {top: '', left: '', bottom: '', right: '', width: '', height: ''};

        if (pushBehavior === 'flyover') {
            switch (anchor) {
                case 'left':
                    opt.top = opt.bottom = opt.left = '0px';
                    break;
                case 'right':
                    opt.top = opt.bottom = opt.right = '0px';
                    break;
                case 'top':
                    opt.top = opt.left = opt.right = '0px';
                    break;
                case 'bottom':
                    opt.bottom = opt.left = opt.right = '0px';
                    break;
            }
        }

        const length = _collapsed ? PTCS.DynamicPanel._size(collapsedPanelSize) : _panelLength;
        if (length !== 'auto') {
            if (vert) {
                opt.width = variant === 'reveal' ? '' : length;
            } else {
                opt.height = length;
            }
        }

        // Assign styling
        this.applyProps(style, opt);
    }

    _minmaxSize(anchor, _collapsed, transition, minPanelSize, maxPanelSize, variant) {
        const vert = anchor === 'left' || anchor === 'right';
        const opt1 = {minWidth: '', minHeight: '', maxWidth: '', maxHeight: ''};
        const opt2 = {width: '', height: '', maxWidth: '', maxHeight: ''};
        const minSize = PTCS.cssDecodeSize(minPanelSize, this, vert);
        const _minPanelSize = minSize < 34 ? '34px' : PTCS.DynamicPanel._size(minPanelSize);
        const _maxPanelSize = PTCS.DynamicPanel._size(maxPanelSize);

        if (!this._tuck(transition, _collapsed)) {
            // Panel is collapsed and not in transition
            if (vert) {
                opt1.minWidth = variant === 'reveal' ? '' : _minPanelSize;
                opt1.maxWidth = variant === 'reveal' ? '' : _maxPanelSize;
            } else {
                opt1.minHeight = variant === 'reveal' ? '' : _minPanelSize;
                opt1.maxHeight = variant === 'reveal' ? '' : _maxPanelSize;
            }
        } else if (vert) {
            opt2.width = (variant === 'reveal' ? '' : this._hideSize) || '';
        } else {
            opt2.height = this._hideSize || '';
        }

        // Assign styling
        this.applyProps(this.$.panelcntr.style, opt1);
        this.applyProps(this.$.panel.style, opt2);
    }

    // Some pre-work is needed when expanding / collapsing
    _collapsedChanged(collapsed) {
        const vert = this.anchor === 'left' || this.anchor === 'right';

        // Cofigure opacity transition
        this._opacityAnim(this.speed, this._collapsed);

        // Save current panel size
        if (collapsed) {
            // Panel is about to collapse. Store the current dimension
            const dimKey = vert ? 'width' : 'height';
            this._hideSize = `${this.$.panel.getBoundingClientRect()[dimKey]}px`;
            if (this._hideSize === '0px') {
                this._hideSize = '';
            }
        } else if (!this._hideSize) {
            // Exapand, without a panel size. Fallback behavior
            let d = PTCS.cssDecodeSize(this.panelSize, this, vert);
            if (isNaN(d)) {
                // Fallback for the cases where the size is 'auto'
                d = this.$.panel.getBoundingClientRect()[vert ? 'width' : 'height'];
            }
            this._hideSize = `${Math.max(d, PTCS.DynamicPanel._minPanelSize)}px`;
        }

        // Start the expand / collapse process
        this._collapsed = collapsed;
        if (this.transition !== undefined) {
            this.transition = true;
        }
        this.dispatchEvent(new CustomEvent('ptcs-dynamic-panel-thumb-resize', {bubbles: true, composed: true}));
    }

    __getCoordinatesFromEvent(ev) {
        let posX, posY;

        if (ev.clientX && ev.clientY) {
            posX = ev.clientX;
            posY = ev.clientY;
        } else if (ev.targetTouches) {
            posX = ev.targetTouches[0].clientX;
            posY = ev.targetTouches[0].clientY;
            // Prevent default behavior to avoid mixing resizing of the dynamic panel with the page scrolling
            ev.preventDefault();
        }

        return {posX, posY};
    }

    _resize(posX, posY, x0 = 0, y0 = 0) {
        const r = this.getBoundingClientRect();

        const f = (a, b, c) => {
            const vertical = this.anchor === 'left' || this.anchor === 'right';
            const _min = PTCS.cssDecodeSize(this.minPanelSize || `${PTCS.DynamicPanel._minPanelSize}px`, this, vertical);
            const _max = PTCS.cssDecodeSize(this.maxPanelSize || '100%', this, vertical);
            const v = Math.min(Math.max(a, _min), _max); // Trim resize position

            const min = PTCS.DynamicPanel._minPanelSize + this.$.panelcntr[c] - this.$.panel[c];
            return v < min ? `${min}px` : `${Math.max(0, Math.min((100 * v) / b, 100))}%`;
        };

        let length;

        switch (this.anchor) {
            case 'left':
                length = f(posX - r.left + x0, r.width, 'offsetWidth');
                break;
            case 'right':
                length = f(r.width - posX + r.left + x0, r.width, 'offsetWidth');
                break;
            case 'top':
                length = f(posY - r.top + y0, r.height, 'offsetHeight');
                break;
            case 'bottom':
                length = f(r.height - posY + r.top + y0, r.height, 'offsetHeight');
                break;
            /* istanbul ignore next */
            default:
                return;
        }

        this.setProperties({
            _autoPanel:   false,
            _panelLength: length
        });

        this.dispatchEvent(new CustomEvent('ptcs-dynamic-panel-thumb-resize', {bubbles: true, composed: true}));
    }

    _resizeEv(ev, x0, y0) {
        const {posX, posY} = this.__getCoordinatesFromEvent(ev);
        this._resize(posX, posY, x0, y0);
    }

    _step(delta, animate) {
        const r = this.$.panelcntr.getBoundingClientRect();

        if (!animate && !this.sizing) {
            // Don't animate the delta change
            this.sizing = true;
            requestAnimationFrame(() => {
                this.sizing = false;
            });
        }

        switch (this.anchor) {
            case 'left':
                this._resize(r.right + delta, 0);
                break;
            case 'right':
                this._resize(r.left + delta, 0);
                break;
            case 'top':
                this._resize(0, r.bottom + delta);
                break;
            case 'bottom':
                this._resize(0, r.top + delta);
                break;
        }
    }

    _mouseDown(ev, touch = false) {
        if (this._collapsed || this.hideThumb || this.disabled || this.variant === 'reveal') {
            return;
        }

        const {posX, posY} = this.__getCoordinatesFromEvent(ev);

        const r = this.$.panelcntr.getBoundingClientRect();
        const x = this.anchor === 'left' ? r.right - posX : posX - r.left;
        const y = this.anchor === 'top' ? r.bottom - posY : posY - r.top;

        const mouseMoveEv = touch ? 'touchmove' : 'mousemove';
        const mouseUpEv = touch ? 'touchend' : 'mouseup';

        const mmv = ev1 => this._resizeEv(ev1, x, y);

        this.sizing = true;

        let mup = () => {
            window.removeEventListener(mouseMoveEv, mmv);
            window.removeEventListener(mouseUpEv, mup);
            this.sizing = false;
        };

        window.addEventListener(mouseMoveEv, mmv);
        window.addEventListener(mouseUpEv, mup);
    }

    _transitionStart(ev) {
        if (ev.srcElement.classList.contains('panel-cntr')) {
            this.transition = true;
        }
    }

    _transitionCancel(ev) {
        this._transitionEnd(ev);
    }

    _transitionEnd(ev) {
        if (ev.srcElement.classList.contains('panel-cntr')) {
            this.transition = false;
            if (this._autoPanel) {
                this._panelLength = 'auto';
            }
        }
    }

    _getSpeed() {
        const m = /^([0-9]+)(s|ms)$/g.exec(this.speed);
        if (!m) {
            return 200;
        }
        return Number(m[2] === 's' ? 1000 * m[1] : m[1]);
    }

    _animationSpeed(speed, sizing) {
        const style = this.$.panelcntr.style;

        if (sizing) {
            style.transition = '';
        } else {
            style.transition = `${speed} width, ${speed} height`;
        }

        this._opacityAnim(speed, this.collapsed);
    }

    _opacityAnim(speed, collapsed) {
        const d = (this._getSpeed(speed) / 2) + 'ms';
        const t1 = `opacity ${d}`;
        const t2 = `opacity ${d} ${d}`;

        this.$.trigger.style.transition = collapsed ? t2 : t1;
        this.$.trigger2.style.transition = collapsed ? t1 : t2;
    }

    _clickOutsideToClose(clickOutsideToClose, _connected, collapsed, disableOutsideClickForMashupIDE) {
        if (clickOutsideToClose && _connected && !collapsed && !disableOutsideClickForMashupIDE) {
            requestAnimationFrame(() => {
                if (!this._close_ev && this.clickOutsideToClose && this._connected && !this.collapsed && !this.disableOutsideClickForMashupIDE) {
                    // Close the panel if the user clicks anywhere outside of it
                    this._close_ev = ev => {
                        if (this.disabled) {
                            return;
                        }
                        for (let el = ev.srcElement; el; el = el.parentNode) {
                            if (el.parentNode === this) {
                                if (el.getAttribute && el.getAttribute('slot') === 'panel') {
                                    // Clicked in the panel content
                                    return;
                                }
                                break;
                            } else if (el === this) {
                                // Clicked in the shadow dom (=== panel)
                                return;
                            }
                        }
                        this.collapsed = true;
                    };
                    this._close_ev_scrim = () => {
                        if (!this.disabled) {
                            this.collapsed = true;
                        }
                    };

                    document.addEventListener('click', this._close_ev);
                    this.$.scrim.addEventListener('click', this._close_ev_scrim);
                }
            });
        } else if (this._close_ev) {
            document.removeEventListener('click', this._close_ev);
            this.$.scrim.removeEventListener('click', this._close_ev_scrim);
            this._close_ev = null;
            this._close_ev_scrim = null;
        }
    }

    _keyDown(ev) {
        const STEP_SIZE = 4;
        const STEP_MAX = 30000; // Huge step that will reach end of side

        // Disable or do a sub-component have the focus?
        if (ev.defaultPrevented || this.disabled || !PTCS.hasFocus(this)) {
            return;
        }

        // Vertical orientation?
        const vertical = this.anchor === 'left' || this.anchor === 'right';

        // Focus on trigger or (resize) thumb?
        switch (ev.key) {
            case 'ArrowLeft':
                if (vertical) {
                    this._step(-STEP_SIZE);
                    ev.preventDefault();
                }
                break;

            case 'ArrowRight':
                if (vertical) {
                    this._step(STEP_SIZE);
                    ev.preventDefault();
                }
                break;

            case 'ArrowUp':
                if (!vertical) {
                    this._step(-STEP_SIZE);
                    ev.preventDefault();
                }
                break;

            case 'ArrowDown':
                if (!vertical) {
                    this._step(STEP_SIZE);
                    ev.preventDefault();
                }
                break;

            case 'Home':
                this._step(-STEP_MAX, true);
                ev.preventDefault();
                break;

            case 'End':
                this._step(STEP_MAX, true);
                ev.preventDefault();
                break;

            case 'Enter':
                this.collapsed = !this.collapsed;
                ev.preventDefault();
                break;
        }
    }


    _mouseEnter(ev) {
        // Work-around to notify theme engine about that the mouse hovers over the thumb area
        this.hoverThumb = true;
        this._tooltipEnter(ev.target, ev.clientX, ev.clientY);
    }

    _mouseLeave(ev) {
        this.hoverThumb = false;
        this._tooltipLeave(ev.target);
    }
};

PTCS.DynamicPanel._minPanelSize = 34;


customElements.define(PTCS.DynamicPanel.is, PTCS.DynamicPanel);
