import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-icon/ptcs-icon.js';
import 'ptcs-icons/cds-icons.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import 'ptcs-behavior-validate/ptcs-behavior-validate.js';
import {updateTooltipInFocus, hoverTooltip, closeTooltip} from 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';


Math._sldrPercent = v => (100 * v).toFixed(2);

PTCS.Slider = class extends PTCS.BehaviorTabindex(PTCS.BehaviorValidate(PTCS.BehaviorFocus(
    PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))))) {
    static get template() {
        return html`
        <style>
        :host {
            position: relative;
            display: inline-flex;
            flex-wrap: nowrap;
            align-items: center;
            align-content: center;
            justify-content: space-between;
            flex-direction: column;
        }

        :host([dragging-thumb]) {
            user-select: none;
            -ms-user-select: none;
        }

        :host(:not([vertical]):not([_no-space-for-message])) {
            justify-content: center;
        }

        :host([vertical]) {
            justify-content: space-between;
        }

        [part=label] {
            width: 100%;
            flex-shrink: 0;
        }

        .grid {
            display: grid;
            display: -ms-grid;
        }

        :host(:not([vertical])) .grid {
            width: 100%;
            grid-template-columns: auto 1fr 1fr auto;
            grid-template-rows: auto auto auto;
            -ms-grid-columns: auto 1fr 1fr auto;
            -ms-grid-rows: auto auto auto;
        }

        :host([vertical]) .grid {
            flex: 1 1 auto;
            grid-template-columns: auto auto auto;
            grid-template-rows: auto 1fr 1fr auto;
            -ms-grid-columns: auto auto auto;
            -ms-grid-rows: auto 1fr 1fr auto;
        }

        :host(:not([vertical])) [part=icon-min] {
            grid-column: 1;
            grid-row: 2;
            -ms-grid-column: 1;
            -ms-grid-row: 2;
            align-self: center;
            -ms-grid-row-align: center;
        }

        :host(:not([vertical])[reverse-minmax]) [part=icon-min] {
            grid-column: 4;
            -ms-grid-column: 4;
        }

        :host(:not([vertical])) [part=icon-max] {
            grid-column: 4;
            grid-row: 2;
            -ms-grid-column: 4;
            -ms-grid-row: 2;
            align-self: center;
            -ms-grid-row-align: center;
        }

        :host(:not([vertical])[reverse-minmax]) [part=icon-max] {
            grid-column: 1;
            -ms-grid-column: 1;
        }

        .value-container {
            position: relative;
        }

        :host(:not([vertical])) .value-container {
            grid-column: 2 / 4;
            grid-row: 1;
            -ms-grid-column: 2;
            -ms-grid-column-span: 2;
            -ms-grid-row: 1;
        }

        :host(:not([vertical])[reverse-labels]) .value-container {
            grid-row: 3;
            -ms-grid-row: 3;
        }

        :host([vertical]) .value-container {
            grid-column: 1;
            grid-row: 2 / 4;
            -ms-grid-column: 1;
            -ms-grid-row: 2;
            -ms-grid-row-span: 2;
        }

        :host([vertical][reverse-labels]) .value-container {
            grid-column: 3;
            -ms-grid-column: 3;
        }

        .value-container-inner {
            display: flex;
        }

        :host(:not([vertical])) .value-container-inner {
            width: 100%;
        }

        :host([vertical]) .value-container-inner {
            height: 100%;
        }

        :host(:not([vertical]):not([reverse-minmax])) .value-container-inner {
            flex-direction: row;
        }

        :host(:not([vertical])[reverse-minmax]) .value-container-inner {
            flex-direction: row-reverse;
        }

        :host([vertical]:not([reverse-minmax])) .value-container-inner {
            flex-direction: column;
        }

        :host([vertical][reverse-minmax]) .value-container-inner {
            flex-direction: column-reverse;
        }

        .value-container:not([show-value]) {
            display: none;
        }

        :host(:not([dragging-thumb])) .value-container[show-value=drag]
        {
            visibility: hidden;
        }

        :host(:not([vertical])) [part=slider-container] {
            grid-column: 2 / 4;
            grid-row: 2;

            -ms-grid-column: 2;
            -ms-grid-column-span: 2;
            -ms-grid-row: 2;
            align-self: center;
            -ms-grid-row-align: center;
        }

        :host(:not([vertical])) .min-label-cntr {
            grid-column: 2;
            grid-row: 3;
            -ms-grid-column: 2;
            -ms-grid-row: 3;
        }

        :host(:not([vertical])[reverse-minmax]) .min-label-cntr {
            grid-column: 3;
            -ms-grid-column: 3;
            text-align: right;
        }

        :host(:not([vertical])[reverse-labels]) .min-label-cntr {
            grid-row: 1;
            -ms-grid-row: 1;
        }

        :host(:not([vertical])) .max-label-cntr {
            grid-column: 3;
            grid-row: 3;
            -ms-grid-column: 3;
            -ms-grid-row: 3;
            text-align: right;
        }

        :host(:not([vertical])[reverse-minmax]) .max-label-cntr {
            grid-column: 2;
            -ms-grid-column: 3;
            text-align: left;
        }

        :host(:not([vertical])[reverse-labels]) .max-label-cntr {
            grid-row: 1;
            -ms-grid-row: 1;
        }

        :host([vertical]) [part=icon-min] {
            grid-column: 2;
            grid-row: 1;
            -ms-grid-column: 2;
            -ms-grid-row: 1;
            justify-self: center;
        }

        :host([vertical][reverse-minmax]) [part=icon-min] {
            grid-row: 4;
            -ms-grid-row: 4;
        }

        :host([vertical]) [part=icon-max] {
            grid-column: 2;
            grid-row: 4;
            -ms-grid-column: 2;
            -ms-grid-row: 4;
            justify-self: center;
        }

        :host([vertical][reverse-minmax]) [part=icon-max] {
            grid-row: 1;
            -ms-grid-row: 1;
        }

        :host([vertical]) [part=slider-container] {
            grid-column: 2;
            grid-row: 2 / 4;

            -ms-grid-column: 2;
            -ms-grid-row: 2;
            -ms-grid-row-span: 2;
            justify-self: center;
        }

        :host([vertical]) .min-label-cntr {
            grid-column: 3;
            grid-row: 2;
            -ms-grid-column: 3;
            -ms-grid-row: 2;
        }

        :host([vertical][reverse-minmax]) .min-label-cntr {
            grid-row: 3;
            -ms-grid-row: 3;
            align-self: end;
            -ms-grid-row-align: end;
        }

        :host([vertical][reverse-labels]) .min-label-cntr {
            grid-column: 1;
            -ms-grid-column: 1;
        }

        :host([vertical]) .max-label-cntr {
            grid-column: 3;
            grid-row: 3;
            -ms-grid-column: 3;
            -ms-grid-row: 3;
            align-self: end;
            -ms-grid-row-align: end;
        }

        :host([vertical][reverse-minmax]) .max-label-cntr {
            grid-row: 2;
            -ms-grid-row: 2;
            align-self: start;
            -ms-grid-row-align: start;
        }

        :host([vertical][reverse-labels]) .max-label-cntr {
            grid-column: 1;
            -ms-grid-column: 1;
        }

        [part~=value] {
            display: flex;
            justify-content: center;
            align-items: center;
        }

        [part~=value][editing] .read {
            display: none;
        }

        .write {
            outline: none; /* Handled by theming */
            border: none;
            text-align: center;
            padding: 8px;
        }

        [part~=value]:not([editing]) .write {
            display: none;
        }

        [part~=value] input {
            width: calc(100% - 0.5em);
            max-width: 4em;
        }

        [part=slider-container] {
            display: inline-block;
            flex: 1 1 auto;
            position: relative;
        }

        :host(:not([vertical])) [part=slider-container] {
            width: 100%;
        }

        :host([vertical]) [part=slider-container] {
            height: 100%;
        }

        [part~=thumb] {
            position: absolute;
            box-sizing: border-box;
            fill: currentColor;

            /* Remove default padding in ptcs-icon */
            padding: 0px;
        }

        [part~=thumb1][z-top]:not(:focus) {
            z-index: 15;
        }

        [part~=thumb]:focus {
            z-index: 16;
        }

        :host(:not([range])) [part~=thumb2],
        :host(:not([range])) [part~=value2] {
            display: none;
        }

        [part=track] {
            position: absolute;
            overflow: hidden;
            box-sizing: border-box;

            display: flex;
            flex-wrap: nowrap;
            justify-content: space-between;
            align-items: stretch;
            align-content: stretch;
        }

        :host(:not([vertical])) [part=track] {
            flex-direction: row;
        }

        :host([vertical]) [part=track] {
            flex-direction: column;
        }

        :host(:not([vertical])[reverse-minmax]) [part=track] {
            flex-direction: row-reverse;
        }

        :host([vertical][reverse-minmax]) [part=track] {
            flex-direction: column-reverse;
        }

        [part=track-between] {
            flex-grow: 1;
        }

        [part=track-before], [part=track-after] {
            flex: 0 0 auto;
        }

        :host(:not([range])) [part=track-between],
        :host([range-collapsed]) [part=track-between] {
            display: none;
        }

        :host(:not([vertical])) [part=track-before],
        :host(:not([vertical])) [part=track-between],
        :host(:not([vertical])) [part=track-after] {
            height: 100%;
        }

        :host([vertical]) [part=track-before],
        :host([vertical]) [part=track-between],
        :host([vertical]) [part=track-after] {
            width: 100%;
        }

        ptcs-icon[hidden] {
            display: none;
        }

        /* Arrow on value container */
        [part~=value] {
            position: relative;
        }

        [part~=value-arrow] {
            position: absolute;
            border: 2px solid transparent;
        }

        :host(:not([vertical]):not([reverse-labels])) [part~=value-arrow] {
            bottom: -5px;
            left: calc(50% - 2px);
            border-top-color: currentColor;
        }

        :host(:not([vertical])[reverse-labels]) [part~=value-arrow] {
            top: -5px;
            left: calc(50% - 2px);
            border-bottom-color: currentColor;
        }

        :host([vertical]:not([reverse-labels])) [part~=value-arrow] {
            top: calc(50% - 2px);
            right: -5px;
            border-left-color: currentColor;
        }

        :host([vertical][reverse-labels]) [part~=value-arrow] {
            top: calc(50% - 2px);
            left: -5px;
            border-right-color: currentColor;
        }

        </style>
        <ptcs-label part="label" hidden\$="[[_hide(label)]]" label="[[label]]" horizontal-alignment="[[labelAlignment]]"
                    variant="[[labelVariant]]" multi-line></ptcs-label>
        <div class="grid">
        <ptcs-icon part="icon-min" hidden\$="[[_hide(minIcon)]]" icon-set="[[iconSet]]" icon="[[minIcon]]" size="[[minIconSize]]"></ptcs-icon>
        <div class="value-container" show-value\$="[[_attrShowValue(showValue)]]">
        <div class="value-container-inner">
        <div id="value-sep1"></div>
        <div part="value1 value" id="value1" on-click="_editValue" editing\$="[[_edit1]]">
        <div part="value-arrow" editing\$="[[_edit1]]"></div>
        <span class="read">[[_prec(_value, precision)]]</span>
        <input class="write" type="text" value="{{value::change}}" on-change="_onStopEdit" on-blur="_onStopEdit">
        </div>
        <div id="value-sep2"></div>
        <div part="value2 value" id="value2" on-click="_editValue2" editing\$="[[_edit2]]">
        <div part="value-arrow" editing\$="[[_edit2]]"></div>
        <span class="read">[[_prec(_value2, precision)]]</span>
        <input class="write" type="text" value="{{value2::change}}" on-change="_onStopEdit" on-blur="_onStopEdit">
        </div>
        <div id="value-sep3"></div>
        </div>
        </div>
        <div part="slider-container" id="slider-container">
        <div part="track" id="track">
        <div part="track-before" id="track-before" on-click="_clickTrack1"></div>
        <div part="track-between" id="track-between" on-click="_clickTrack2"></div>
        <div part="track-after" id="track-after" on-click="_clickTrack3"></div>
        </div>
        <ptcs-icon part="thumb thumb1" id="thumb" size="x" tabindex\$="[[_dfTabindex(_delegatedFocus, _noSpaceForMessage)]]"
            z-top\$="[[_thumb1AtTop]]" icon-set\$="[[_iconSet(iconSet, thumbIcon)]]" icon\$="[[_thumb1Icon(vertical, reverseMinmax, thumbIcon)]]"
            tooltip="[[thumbTooltip]]" tooltip-icon="[[thumbTooltipIcon]]" tooltip-pos="[[_thumbPos1(reverseLabels, reverseMinmax)]]"
            on-dragstart="_ondragstart"></ptcs-icon>
        <ptcs-icon part="thumb thumb2" id="thumb2" size="x" tabindex\$="[[_dfTabindex(_delegatedFocus, _noSpaceForMessage)]]"
            icon-set\$="[[_iconSet(iconSet, thumb2Icon, thumbIcon)]]" icon\$="[[_thumb2Icon(vertical, reverseMinmax, thumb2Icon, thumbIcon)]]"
            tooltip="[[thumb2Tooltip]]" tooltip-icon="[[thumb2TooltipIcon]]" tooltip-pos="[[_thumbPos2(reverseLabels, reverseMinmax)]]"
            on-dragstart="_ondragstart"></ptcs-icon>
        </div>
        <div class="min-label-cntr">
        <div part="min-label min-max-label" hidden\$="[[_hideLabel(minLabel, showMinMaxLabels)]]">[[minLabel]]</div>
        </div>
        <div class="max-label-cntr">
        <div part="max-label min-max-label" hidden\$="[[_hideLabel(maxLabel, showMinMaxLabels)]]">[[maxLabel]]</div>
        </div>
        <ptcs-icon part="icon-max" hidden\$="[[_hide(maxIcon)]]" icon-set="[[iconSet]]" icon="[[maxIcon]]" size="[[maxIconSize]]"></ptcs-icon>
        </div>
        `;
    }

    static get is() {
        return 'ptcs-slider';
    }

    static get properties() {
        return {
            variant: {
                type:               String,
                reflectToAttribute: true
            },

            label: {
                type:  String,
                value: ''
            },

            labelVariant: {
                type: String
            },

            // left, center, right. left is default
            labelAlignment: {
                type: String
            },

            value: {
                type:   String,
                value:  '0',
                notify: true
            },

            _value: {
                type: Number
            },

            _thumb1AtTop: {
                type: Boolean
            },

            value2: {
                type:   String,
                value:  '100',
                notify: true
            },

            _value2: {
                type: Number
            },

            minValueWidth: {
                type:    Number,
                default: 34
            },

            maxValueWidth: {
                type:    Number,
                default: 96
            },

            // Displayed current value(s)?
            showValue: {
                type: String // yes, true, false, no, <undefined>, drag (= only when dragging)
            },

            // Can displayed value be edited?
            editValue: {
                type: Boolean
            },

            // Is value1 beeing edited?
            _edit1: {
                type: Boolean
            },

            // Is value2 beeing edited?
            _edit2: {
                type: Boolean
            },

            minValue: {
                type:     String,
                value:    '0',
                observer: '_minValueChanged'
            },

            // = Number(minValue), if minValue is a valid Number
            _minValue: {
                type: Number
            },

            maxValue: {
                type:     String,
                value:    '100',
                observer: '_maxValueChanged'
            },

            // = Number(maxValue), if maxValue is a valid Number
            _maxValue: {
                type: Number
            },

            minValidValue: {
                type:    Number,
                isValue: minValidValue => !!minValidValue && !isNaN(minValidValue)
            },

            minValueFailureMessage: {
                type: String
            },

            maxValidValue: {
                type:    Number,
                isValue: maxValidValue => !!maxValidValue && !isNaN(maxValidValue)
            },

            maxValueFailureMessage: {
                type: String
            },

            // Client-provided custom validation function
            extraValidation: {
                type: Function
            },

            numStep: {
                type: Number
            },

            sizeStep: {
                type: Number
            },

            precision: {
                type:  Number,
                value: 0
            },

            _stepUnit: {
                type:     Number,
                computed: '_computeStepUnit(numStep, sizeStep, _minValue, _maxValue, precision)'
            },

            minLabel: {
                type: String
            },

            maxLabel: {
                type: String
            },

            showMinMaxLabels: {
                type:     Boolean,
                observer: '_updateHideMinMaxLabels'
            },

            hideMinMaxLabels: {
                type:     Boolean,
                value:    false,
                observer: '_updateShowMinMaxLabels'
            },

            vertical: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            disabled: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            range: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            rangeCollapsed: {
                type:               Boolean,
                computed:           '_computeRangeCollapsed(_value, _value2)',
                reflectToAttribute: true
            },

            overlapThumbs: {
                type: Boolean
            },

            thumbSize: {
                type:     Number,
                value:    44,
                observer: '_thumbSizeChanged'
            },

            trackSize: {
                type:  Number,
                value: 20
            },

            fullTrack: {
                type: Boolean
            },

            trackPlacement: { // center, start, end, (horizontal) {top=start, bottom=end}, (vertical){left=start, right=end}
                type: String
            },

            iconSet: {
                type: String
            },

            thumbIcon: {
                type:  String,
                value: null
            },

            thumbTooltip: {
                type: String
            },

            thumbTooltipIcon: {
                type: String
            },

            thumb2Icon: {
                type:  String,
                value: null
            },

            thumb2Tooltip: {
                type: String
            },

            thumb2TooltipIcon: {
                type: String
            },

            minIcon: {
                type:  String,
                value: null
            },

            minIconSize: {
                type: String
            },

            maxIcon: {
                type:  String,
                value: null
            },

            maxIconSize: {
                type: String
            },

            reverseMinmax: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            reverseLabels: {
                type:               Boolean,
                reflectToAttribute: true
            },

            draggingThumb: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // How long is single step? (arrow key navigation)
            step: {
                type: Number
            },

            _delegatedFocus: {
                type:  String,
                value: null
            },

            /* ARIA */
            role: {
                type:               String,
                computed:           '_ariaRole(_delegatedFocus)',
                reflectToAttribute: true
            },

            ariaValuenow: {
                type:               String,
                computed:           '_ariaValue(_value, precision, range, _value2)',
                reflectToAttribute: true,
                validate:           '_validateSlider(minValidValue, maxValidValue, extraValidation)'
            },

            ariaValuemin: {
                type:               String,
                computed:           '_ariaValue(_minValue, precision)',
                reflectToAttribute: true
            },

            ariaValuemax: {
                type:               String,
                computed:           '_ariaValue(_maxValue, precision)',
                reflectToAttribute: true
            },

            ariaOrientation: {
                type:               String,
                computed:           '_ariaOrientation(vertical)',
                reflectToAttribute: true
            },

            ariaDisabled: {
                type:               String,
                computed:           '_ariaDisabled(disabled)',
                reflectToAttribute: true
            },

            ariaLabel: {
                type:               String,
                computed:           '_ariaLabel(label)',
                reflectToAttribute: true
            },

            _noSpaceForMessage: {
                type:               Boolean,
                reflectToAttribute: true
            }
        };
    }

    static get observers() {
        return [
            '_minmaxLabelMove(reverseMinmax, thumbSize, fullTrack, vertical)',
            '_computeValue(value, _minValue, _maxValue, _stepUnit, precision)',
            '_valueChanged(_value, _minValue, _maxValue, thumbSize, range, overlapThumbs, vertical, reverseMinmax, trackPlacement)',
            '_computeValue2(value2, _minValue, _maxValue, _stepUnit, precision)',
            '_value2Changed(_value2, _minValue, _maxValue, thumbSize, overlapThumbs, vertical, reverseMinmax, trackPlacement)',
            '_sliderContainer(thumbSize, trackSize, vertical)',
            '_valueMove(_value, _value2, _minValue, _maxValue, thumbSize, range, overlapThumbs, vertical)',
            '_trackMove(_value, _value2, _minValue, _maxValue, range, rangeCollapsed, vertical, thumbSize, overlapThumbs)',
            '_trackConfig(thumbSize, overlapThumbs, vertical, trackSize, trackPlacement, fullTrack)'
        ];
    }

    // The focus manager should only track the focus of the thumbs
    ready() {
        super.ready();

        // Unless otherwise noted, a slider should not start validation until the user moves the thumb
        if (this._stayUnvalidated === undefined) {
            this._stayUnvalidated = true;
        }
        this._trackFocus(this.$.thumb);
        this._trackFocus(this.$.thumb2);
        // Tooltips
        this.$.value1.addEventListener('mouseenter', ev => this._mouseTooltip(ev));
        this.$.value1.addEventListener('mouseleave', () => requestAnimationFrame(closeTooltip));
        this.$.value2.addEventListener('mouseenter', ev => this._mouseTooltip(ev));
        this.$.value2.addEventListener('mouseleave', () => requestAnimationFrame(closeTooltip));
        const beginValidate = () => {
            this._stayUnvalidated = false;
        };
        // Add mouse/touch event handlers for both thumbs
        this.$.thumb.addEventListener('mousedown', ev => {
            this._stayUnvalidated = true;
            this._mouseDn1(ev);
            document.addEventListener('mouseup', beginValidate, {once: true});
        });
        this.$.thumb.addEventListener('touchstart', ev => {
            this._stayUnvalidated = true;
            this._mouseDn1(ev, true);
            document.addEventListener('touchend', beginValidate, {once: true});
        });
        this.$.thumb.addEventListener('keydown', ev => {
            this._stayUnvalidated = true;
            this._keyDn1(ev);
            document.addEventListener('keyup', beginValidate, {once: true});
        });
        this.$.thumb2.addEventListener('mousedown', ev => {
            this._stayUnvalidated = true;
            this._mouseDn2(ev);
            document.addEventListener('mouseup', beginValidate, {once: true});
        });
        this.$.thumb2.addEventListener('touchstart', ev => {
            this._stayUnvalidated = true;
            this._mouseDn2(ev, true);
            document.addEventListener('touchend', beginValidate, {once: true});
        });
        this.$.thumb2.addEventListener('keydown', ev => {
            this._stayUnvalidated = true;
            this._keyDn2(ev);
            document.addEventListener('keyup', beginValidate, {once: true});
        });
        this.$['slider-container'].addEventListener('click', beginValidate, {once: true});
        this.$['slider-container'].addEventListener('touchend', beginValidate, {once: true});
    }

    _ondragstart() {
        return false;
    }

    _ariaRole(_delegatedFocus) {
        return (_delegatedFocus !== false && _delegatedFocus !== undefined) ? 'slider' : false;
    }

    _ariaValue(_value, precision, range, _value2) {
        if (range) {
            return `${this._prec(_value, precision)} to ${this._prec(_value2, precision)}`;
        }

        return this._prec(_value, precision);
    }

    _ariaOrientation(vertical) {
        return vertical ? 'vertical' : false;
    }

    _ariaLabel(label) {
        return label ? label : false;
    }

    _ariaDisabled(disabled) {
        return disabled;
    }

    _hide(prop) {
        return !prop;
    }

    _hideLabel(label, showMinMaxLabels) {
        return !label || !showMinMaxLabels;
    }

    _prec(value, precision) {
        if (!(precision > 0)) {
            precision = 0;
        }
        return (typeof value === 'number' && value.toFixed) ? value.toFixed(precision) : value;
    }

    _iconSet(iconSet, thumbIcon, thumbIcon2) {
        const thumb = thumbIcon || thumbIcon2;
        if (typeof thumb !== 'string' || thumb[0] !== '#') {
            return iconSet;
        }
        switch (thumb) {
            case '#circle':
            case '#hexagon':
            case '#split':
                return undefined;
        }
        return iconSet;
    }

    _thumb1Icon(vertical, reverseMinmax, thumbIcon) {
        switch (thumbIcon) {
            case '#circle':
                return 'cds:icon_thumb_circle';
            case '#hexagon':
                return 'cds:icon_thumb_hexagon';

            case '#split':
                if (vertical) {
                    return reverseMinmax ? 'cds:icon_thumb_split_bottom' : 'cds:icon_thumb_split_top';
                }
                return reverseMinmax ? 'cds:icon_thumb_split_right' : 'cds:icon_thumb_split_left';
        }
        return thumbIcon;
    }

    _thumb2Icon(vertical, reverseMinmax, thumbIcon, thumbIconAlt) {
        switch (thumbIcon) {
            case '#circle':
                return 'cds:icon_thumb_circle';
            case '#hexagon':
                return 'cds:icon_thumb_hexagon';
        }

        if ((thumbIcon || thumbIconAlt) === '#split') {
            if (vertical) {
                return reverseMinmax ? 'cds:icon_thumb_split_top' : 'cds:icon_thumb_split_bottom';
            }
            return reverseMinmax ? 'cds:icon_thumb_split_left' : 'cds:icon_thumb_split_right';
        }

        return thumbIcon;
    }

    _thumbPos1(reverseLabels, reverseMinmax) {
        if (reverseMinmax) {
            return reverseLabels ? 'tr tl' : 'br bl';
        }
        return reverseLabels ? 'tl tr' : 'bl br';
    }

    _thumbPos2(reverseLabels, reverseMinmax) {
        if (reverseMinmax) {
            return reverseLabels ? 'tl tr' : 'bl br';
        }
        return reverseLabels ? 'tr tl' : 'br bl';
    }

    _v2s(v) {
        return this._prec(v, this.precision);
    }

    _oneStep() {
        const minStep = this._stepUnit ? this._stepUnit : 1;
        return Number(this.step > minStep ? this.step : minStep);
    }

    _onePage() {
        return 5 * this._oneStep();
    }

    _computeStepUnit(numStep, sizeStep, _minValue, _maxValue, precision) {
        if (numStep >= 1 && _maxValue > _minValue) {
            return (_maxValue - _minValue) / numStep;
        }
        if (sizeStep > 0) {
            return sizeStep;
        }
        if (precision > 0) {
            return Math.pow(10, -precision);
        }

        return 1;
    }

    _computeRangeCollapsed(_value, _value2) {
        return _value === _value2;
    }

    _attrShowValue(showValue) {
        switch (showValue) {
            case 'yes': case 'true': case '':
                return 'yes';
            case 'drag':
                return 'drag';
        }

        return false;
    }

    _minValueChanged(minValue) {
        const v = Number(minValue);
        if (!isNaN(v)) {
            this._minValue = v;
        }
    }

    _maxValueChanged(maxValue) {
        const v = Number(maxValue);
        if (!isNaN(v)) {
            this._maxValue = v;
        }
    }

    _minmaxLabelMove(reverseMinmax, thumbSize, fullTrack, vertical) {
        const s1 = this.shadowRoot.querySelector('.min-label-cntr').style;
        const s2 = this.shadowRoot.querySelector('.max-label-cntr').style;
        const v = fullTrack ? '' : `${thumbSize / 2}px`;

        if (vertical) {
            if (reverseMinmax) {
                s1.paddingTop = s2.paddingBottom = '';
                s1.paddingBottom = s2.paddingTop = v;
            } else {
                s1.paddingTop = s2.paddingBottom = v;
                s1.paddingBottom = s2.paddingTop = '';
            }
            s1.paddingLeft = s1.paddingRight = s2.paddingLeft = s2.paddingRight = '';
        } else {
            if (reverseMinmax) {
                s1.paddingLeft = s2.paddingRight = '';
                s1.paddingRight = s2.paddingLeft = v;
            } else {
                s1.paddingLeft = s2.paddingRight = v;
                s1.paddingRight = s2.paddingLeft = '';
            }
            s1.paddingTop = s1.paddingBottom = s2.paddingTop = s2.paddingBottom = '';
        }
    }

    // $slider-container width, height
    _sliderContainer(thumbSize, trackSize, vertical) {
        const s = this.$['slider-container'].style;

        if (vertical) {
            s.width = `${Math.max(thumbSize, trackSize)}px`;
            s.height = '';
        } else {
            s.width = '';
            s.height = `${Math.max(thumbSize, trackSize)}px`;
        }
    }

    // $thumb, $thumb2 width height
    _thumbSizeChanged(thumbSize) {
        const s1 = this.$.thumb.style;
        const s2 = this.$.thumb2.style;
        s1.width = s1.height = s2.width = s2.height = `${thumbSize}px`;
    }

    // $thumb $value top | left
    static _setValueStyle(style, offsv, center, vertical, reverseMinmax, trackPlacement) {
        if (vertical) {
            if (reverseMinmax) {
                style.top = '';
                style.bottom = offsv;
            } else {
                style.top = offsv;
                style.bottom = '';
            }
            switch (trackPlacement) {
                case 'start': case 'left':
                    style.left = '0px';
                    style.right = '';
                    break;

                case 'end': case 'right':
                    style.left = '';
                    style.right = '0px';
                    break;

                default:
                    style.left = center;
                    style.right = '';
            }
        } else {
            if (reverseMinmax) {
                style.left = '';
                style.right = offsv;
            } else {
                style.left = offsv;
                style.right = '';
            }
            switch (trackPlacement) {
                case 'start': case 'left':
                    style.top = '0px';
                    style.bottom = '';
                    break;

                case 'end': case 'right':
                    style.top = '';
                    style.bottom = '0px';
                    break;

                default:
                    style.top = center;
                    style.bottom = '';
            }
        }
    }


    // $thumb $value top | left
    _valueChanged(_value, _minValue, _maxValue, thumbSize, range, overlapThumbs, vertical, reverseMinmax, trackPlacement) {
        const v = (_value - _minValue) / (_maxValue - _minValue);
        const numThumbs = (range && !overlapThumbs) ? 2 : 1;
        PTCS.Slider._setValueStyle(
            this.$.thumb.style,
            `calc(${Math._sldrPercent(v)}% - ${Math.floor(v * numThumbs * thumbSize)}px)`,
            `calc(50% - ${thumbSize / 2}px)`,
            vertical,
            reverseMinmax,
            trackPlacement);
        if (!this.draggingThumb) {
            this._thumb1AtTop = true;
        }
        this._updateValueWidth(this.$.value1, _value);
        this._updateTooltip();
    }

    // $thumb2 $value2 top | left
    _value2Changed(_value2, _minValue, _maxValue, thumbSize, overlapThumbs, vertical, reverseMinmax, trackPlacement) {
        const v = (_value2 - _minValue) / (_maxValue - _minValue);
        const numThumbs = overlapThumbs ? 1 : 2;
        const adjustThumb1 = overlapThumbs ? 0 : 1;
        PTCS.Slider._setValueStyle(
            this.$.thumb2.style,
            `calc(${Math._sldrPercent(v)}% - ${Math.floor((v * numThumbs - adjustThumb1) * thumbSize)}px)`,
            `calc(50% - ${thumbSize / 2}px)`,
            vertical,
            reverseMinmax,
            trackPlacement);
        if (!this.draggingThumb) {
            this._thumb1AtTop = false;
        }
        this._updateValueWidth(this.$.value2, _value2);
        this._updateTooltip2();
    }

    __compute(value, minValue, maxValue, stepUnit, precision) {
        // Make sure max and min values always can be selected
        if (!isNaN(minValue) && value <= minValue) {
            return minValue;
        }
        if (!isNaN(maxValue) && value >= maxValue) {
            return maxValue;
        }
        // Normalize value according to settings
        if (stepUnit) {
            value = Math.round(value / stepUnit) * stepUnit;
        }
        if (!(precision > 0)) {
            value = Math.round(value);
        }
        if (!isNaN(minValue)) {
            value = Math.max(value, minValue);
        }
        if (!isNaN(maxValue)) {
            value = Math.min(value, maxValue);
        }
        return value;
    }


    _computeValue(value, _minValue, _maxValue, _stepUnit, precision) {
        let v = Number(value);
        if (isNaN(v)) {
            // Ignore non numeric values
            return;
        }
        this._value = this.__compute(v, _minValue, _maxValue, _stepUnit, precision);
        if (this._value2 < this._value) {
            this.value2 = this._v2s(this._value);
        }
    }

    _computeValue2(value2, _minValue, _maxValue, _stepUnit, precision) {
        let v = Number(value2);
        if (isNaN(v)) {
            // Ignore non numeric values
            return;
        }
        this._value2 = this.__compute(v, _minValue, _maxValue, _stepUnit, precision);
        if (this._value > this._value2) {
            this.value = this._v2s(this._value2);
        }
    }

    _valueMove(_value, _value2, _minValue, _maxValue, thumbSize, range, overlapThumbs, vertical) {
        const v1 = (_value - _minValue) / (_maxValue - _minValue);
        const v2 = (_value2 - _minValue) / (_maxValue - _minValue);
        const c1 = 1 - v1; // Complementary to v1
        const s1 = this.$['value-sep1'].style;
        const s2 = this.$['value-sep2'].style;
        const s3 = this.$['value-sep3'].style;
        const pp = vertical ? 'height' : 'width'; // Primary property
        const cp = vertical ? 'width' : 'height'; // Complementary property

        // Very temporary fix
        if (thumbSize < 30) {
            thumbSize = 30;
        }

        if (range) {
            const _2 = (v2 - v1);
            const _3 = (1 - v2);

            if (overlapThumbs) {
                s1[pp] = `calc(${Math._sldrPercent(v1)}%)`;
                s2[pp] = `calc(${Math._sldrPercent(_2)}% - ${thumbSize}px)`;
                s3[pp] = `calc(${Math._sldrPercent(_3)}%)`;
            } else {
                s1[pp] = `calc(${Math._sldrPercent(v1)}% - ${v1 * thumbSize / 2}px)`;
                s2[pp] = `calc(${Math._sldrPercent(_2)}% - ${_2 * thumbSize}px)`;
                s3[pp] = `calc(${Math._sldrPercent(_3)}% - ${_3 * thumbSize / 2}px)`;
            }
        } else {
            s1[pp] = `calc(${Math._sldrPercent(v1)}% - ${v1 * thumbSize / 2}px)`;
            s2[pp] = '';
            s3[pp] = `calc(${Math._sldrPercent(c1)}% - ${c1 * thumbSize / 2}px)`;
        }

        s1[cp] = s2[cp] = s3[cp] = ''; // '10px' --- debugging
    }


    _trackMove(_value, _value2, _minValue, _maxValue, range, rangeCollapsed, vertical, thumbSize, overlapThumbs) {
        const [k1, k2] = vertical ? ['height', 'width'] : ['width', 'height'];
        const s1 = this.$['track-before'].style;
        const s2 = this.$['track-after'].style;
        const v1 = (_value - _minValue) / (_maxValue - _minValue);

        if (range && !rangeCollapsed) {
            const v2 = (_value2 - _minValue) / (_maxValue - _minValue);
            if (overlapThumbs) {
                s1[k1] = `${100 * v1}%`;
                s2[k1] = `${100 * (1 - v2)}%`;
            } else {
                s1[k1] = `calc(${100 * v1}% - ${v1 * thumbSize}px)`;
                s2[k1] = `calc(${100 * (1 - v2)}% - ${(1 - v2) * thumbSize}px)`;
            }
        } else {
            s1[k1] = `${100 * v1}%`;
            s2[k1] = `${100 * (1 - v1)}%`;
        }
        s1[k2] = s2[k2] = '';
    }

    _trackConfig(thumbSize, overlapThumbs, vertical, trackSize, trackPlacement, fullTrack) {
        const s = this.$['track'].style;

        if (vertical) {
            s.width = `${trackSize}px`;
            s.height = '';
            s.top = s.bottom = fullTrack ? '0px' : `${thumbSize / 2}px`;

            switch (trackPlacement) {
                case 'start': case 'left':
                    s.left = '0px';
                    s.right = '';
                    break;

                case 'end': case 'right':
                    s.left = '';
                    s.right = '0px';
                    break;

                default:
                    s.left = `calc(50% - ${trackSize / 2}px)`;
                    s.right = '';
            }
        } else {
            s.width = '';
            s.height = `${trackSize}px`;
            s.left = s.right = fullTrack ? '0px' : `${thumbSize / 2}px`;

            switch (trackPlacement) {
                case 'start': case 'top':
                    s.top = '0px';
                    s.bottom = '';
                    break;

                case 'end': case 'bottom':
                    s.top = '';
                    s.bottom = '0px';
                    break;

                default:
                    s.top = `calc(50% - ${trackSize / 2}px)`;
                    s.bottom = '';
            }
        }
    }

    __getPosFromEvent(ev) {
        let x, y;
        if (ev.clientX && ev.clientY) {
            x = ev.clientX;
            y = ev.clientY;
        } else if (ev.targetTouches) {
            x = ev.targetTouches[0].clientX;
            y = ev.targetTouches[0].clientY;
            ev.preventDefault();
        }
        return {x, y};
    }

    _mouseToValue1(ev, hit) {
        const pos = this.__getPosFromEvent(ev);
        const r = this.$['slider-container'].getBoundingClientRect();
        const thumbAdjust = this.range && !this.overlapThumbs ? this.thumbSize : 0;
        let value;
        if (this.vertical) {
            const y = this.reverseMinmax ? r.bottom - pos.y : pos.y - r.top;
            const h = r.height - thumbAdjust;
            const _d = hit ? hit.y : this.thumbSize / 2;
            const d = this.reverseMinmax ? this.thumbSize - _d : _d;
            value = (y - d) * (this._maxValue - this._minValue) / (h - this.thumbSize) + this._minValue;
        } else {
            const x = this.reverseMinmax ? r.right - pos.x : pos.x - r.left;
            const w = r.width - thumbAdjust;
            const _d = hit ? hit.x : this.thumbSize / 2;
            const d = this.reverseMinmax ? this.thumbSize - _d : _d;
            value = (x - d) * (this._maxValue - this._minValue) / (w - this.thumbSize) + this._minValue;
        }
        return this.__compute(value, this._minValue, this._maxValue, this._stepUnit, this.precision);
    }

    _mouseToValue2(ev, hit) {
        const pos = this.__getPosFromEvent(ev);
        const r = this.$['slider-container'].getBoundingClientRect();
        const thumbAdjust = this.overlapThumbs ? 0 : Number(this.thumbSize);
        let value;
        if (this.vertical) {
            const y = (this.reverseMinmax ? r.bottom - pos.y : pos.y - r.top) - thumbAdjust;
            const h = r.height - thumbAdjust;
            const _d = hit ? hit.y : this.thumbSize / 2;
            const d = this.reverseMinmax ? this.thumbSize - _d : _d;
            value = (y - d) * (this._maxValue - this._minValue) / (h - this.thumbSize) + this._minValue;
        } else {
            const x = (this.reverseMinmax ? r.right - pos.x : pos.x - r.left) - thumbAdjust;
            const w = r.width - thumbAdjust;
            const _d = hit ? hit.x : this.thumbSize / 2;
            const d = this.reverseMinmax ? this.thumbSize - _d : _d;
            value = (x - d) * (this._maxValue - this._minValue) / (w - this.thumbSize) + this._minValue;
        }
        return this.__compute(value, this._minValue, this._maxValue, this._stepUnit, this.precision);
    }

    _trackMouse(setValue, thumb, touch) {
        let mmv = ev => setValue(ev);

        this.draggingThumb = thumb;
        this._thumb1AtTop = (thumb === 'thumb1');

        const mouseMoveEv = touch ? 'touchmove' : 'mousemove';
        const mouseUpEv = touch ? 'touchend' : 'mouseup';

        let mup = () => {
            window.removeEventListener(mouseMoveEv, mmv);
            window.removeEventListener(mouseUpEv, mup);
            this.draggingThumb = false;
        };

        window.addEventListener(mouseMoveEv, mmv);
        window.addEventListener(mouseUpEv, mup);
    }

    _mouseDn1(ev, touch) {
        if (this.disabled) {
            return;
        }
        const r = this.$.thumb.getBoundingClientRect();
        const pos = this.__getPosFromEvent(ev);
        const hit = {x: pos.x - r.left, y: pos.y - r.top};
        this._trackMouse(e => {
            this.value = this._v2s(this._mouseToValue1(e, hit));
        }, 'thumb1', touch);
    }


    _mouseDn2(ev, touch) {
        if (this.disabled) {
            return;
        }
        const r = this.$.thumb2.getBoundingClientRect();
        const pos = this.__getPosFromEvent(ev);
        const hit = {x: pos.x - r.left, y: pos.y - r.top};
        this._trackMouse(e => {
            this.value2 = this._v2s(this._mouseToValue2(e, hit));
        }, 'thumb2', touch);
    }

    _clickTrack1(ev) {
        if (this.disabled) {
            return;
        }
        this.value = this._v2s(this._mouseToValue1(ev));
    }

    _clickTrack2(ev) {
        if (this.disabled) {
            return;
        }
        this.value = this.value2 = this._v2s((this._mouseToValue1(ev) + this._mouseToValue2(ev)) / 2);
    }

    _clickTrack3(ev) {
        if (this.disabled) {
            return;
        }
        if (this.range) {
            this.value2 = this._v2s(this._mouseToValue2(ev));
        } else {
            this.value = this._v2s(this._mouseToValue1(ev));
        }
    }

    _editValue() {
        if (this.disabled) {
            return;
        }
        this._edit1 = this.editValue && !this.disabled;
        setTimeout(() => {
            const el = this.$.value1.querySelector('input');
            el.select();
            el.focus();
        }, 100);
    }

    _editValue2() {
        if (this.disabled) {
            return;
        }

        this._edit2 = this.editValue && !this.disabled;
        setTimeout(() => {
            const el = this.$.value2.querySelector('input');
            el.select();
            el.focus();
        }, 100);
    }

    _onStopEdit() {
        if (this.disabled) {
            return;
        }
        this._edit1 = this._edit2 = false;
    }

    _handleKeyDown1(key, value) {
        if (this.disabled) {
            return undefined;
        }
        switch (key) {
            case 'ArrowRight':
            case 'ArrowUp':
                return Math.min(value + this._oneStep(), this._maxValue);

            case 'ArrowLeft':
            case 'ArrowDown':
                return Math.max(value - this._oneStep(), this._minValue);

            case 'Home':
                return this._minValue;

            case 'End':
                return this._maxValue;

            case 'PageUp':
                return Math.min(value + this._onePage(), this._maxValue);

            case 'PageDown':
                return Math.max(value - this._onePage(), this._minValue);
        }

        return undefined;
    }

    _handleKeyDown(ev, value) {
        if (this.disabled) {
            return undefined;
        }
        const v = this._handleKeyDown1(ev.key, value);

        if (v === undefined) {
            return value;
        }

        ev.preventDefault();
        return v;
    }

    _keyDn1(ev) {
        if (this.disabled) {
            return;
        }
        this.value = this._v2s(this._handleKeyDown(ev, this._value));
    }

    _keyDn2(ev) {
        if (this.disabled) {
            return;
        }
        this.value2 = this._v2s(this._handleKeyDown(ev, this._value2));
    }

    _updateTooltip() {
        if (this.thumbTooltip) {
            updateTooltipInFocus(this.$.thumb);
        }
    }

    _updateTooltip2() {
        if (this.thumb2Tooltip) {
            updateTooltipInFocus(this.$.thumb2);
        }
    }

    _mouseTooltip(ev) {
        const el = ev.target.querySelector('.read');
        if (el && ev.target.offsetWidth <= el.offsetWidth) {
            // The value overflows the span container
            const b = ev.target.getBoundingClientRect();
            const mousePointerWidth = 12;
            this.__tooltipEl = ev.target;
            hoverTooltip(this.__tooltipEl, Math.min(ev.clientX, b.x + b.width - 2 * mousePointerWidth), ev.clientY, el.innerText);
        }
    }

    _updateValueWidth(el, val) {
        const maxw = this.maxValueWidth || 96;
        el.style.maxWidth = maxw + 'px';
        if (val > 1000) {
            el.style.minWidth = PTCS.isFirefox ? '-moz-fit-content' : 'fit-content';
        } else {
            const minw = this.minValueWidth || 34;
            el.style.minWidth = minw + 'px';
        }
        if (!PTCS.isFirefox && el.offsetWidth >= maxw || PTCS.isFirefox && val > 1E10) {
            el.style.minWidth = maxw + 'px';
        }
    }

    _insertValidationMessage(messageElement) {
        this.defaultInsertValidationMessageForVerticalLayout(messageElement);
    }

    _updateHideMinMaxLabels(v) {
        this.hideMinMaxLabels = !v;
    }

    _updateShowMinMaxLabels(v) {
        this.showMinMaxLabels = !v;
    }

    _validateSlider(minValidValue, maxValidValue, extraValidation) {
        let messages = [];

        const valueNum = Number(this._value);
        const valueNum2 = Number(this._value2);
        const minValue = minValidValue !== '' ? Number(minValidValue) : NaN;
        const maxValue = maxValidValue !== '' ? Number(maxValidValue) : NaN;

        // minValidValue
        if (valueNum !== undefined && valueNum < minValue) {
            const msg = PTCS.replaceStringTokens(this.minValueFailureMessage, {value: minValue});
            messages.push(msg ? msg.join('. ') : false);
        }

        // maxValidValue
        const secondaryValue = this.ariaValuenow.includes('to') ? valueNum2 : valueNum;
        if (secondaryValue !== undefined && secondaryValue > maxValue) {
            const msg = PTCS.replaceStringTokens(this.maxValueFailureMessage, {value: maxValue});
            messages.push(msg ? msg.join('. ') : false);
        }

        // At least one validation failed
        if (messages.length) {
            return messages;
        }

        // All standard validation has succeeded. Leave final say to the custom validation, if any
        return typeof extraValidation === 'function' ? extraValidation(this) : true;
    }

    _dfTabindex(_delegatedFocus, _noSpaceForMessage) {
        return _noSpaceForMessage ? '-1' : _delegatedFocus;
    }

};

customElements.define(PTCS.Slider.is, PTCS.Slider);
