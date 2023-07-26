import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import 'ptcs-hbar/ptcs-hbar.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-icons/cds-icons.js';
import 'ptcs-textfield/ptcs-textfield.js';
import 'ptcs-dropdown/ptcs-dropdown.js';
import './ptcs-datepicker-calendar.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import 'ptcs-behavior-tabindex/ptcs-behavior-tabindex.js';
import 'ptcs-behavior-validate/ptcs-behavior-validate.js';
import moment from 'ptcs-moment/moment-import.js';
import {enableDatePickerEditor, setDate, getDate, hasValidDate, removeDatePickerEditor, hintFormat} from './date-editor.js';

// Simulate invalid moment object
const invalidMomentTime = {isValid: () => false};

const WAIT_RANGE_START_END_UPDATE_MS = 40;

// Convert date to Date
function asDate(date) {
    if (!date) {
        return undefined;
    }
    if (date instanceof Date) {
        return date;
    }
    const date$ = moment(date);
    return date$.isValid() ? date$.toDate() : undefined;
}

// Return a copy of newDate, unless it specifes the same Date as oldDate
// Reason: only trigger update callback if a new date is specified
function updateDate(newDate, oldDate) {
    if (!newDate) {
        return undefined; // Reset date
    }
    return (!oldDate || newDate.getTime() !== oldDate.getTime()) ? new Date(newDate.getTime()) : oldDate;
}

// Verify that a timeText is a valid 12-hour time
function valid12hourTime(timeText) {
    if (typeof timeText !== 'string') {
        return false;
    }
    const hour = timeText.split(':')[0];
    if (!hour || hour < 1 || hour > 12) {
        return false;
    }

    // Just make sure nothing is sneaky with the hour string, such as '4.7'
    return /^\d+$/.test(hour);
}

// Test if two dates specify the same time, ignoring milliseconds
function differentDates(date, date$) {
    // date:  JS Date
    // date$: moment date
    return moment(date).format('YYYY-MM-DD HH:mm:ss') !== date$.format('YYYY-MM-DD HH:mm:ss');
}

// Strip time from Date
function stripTime(date, end) {
    return date ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), end ? 23 : 0, end ? 59 : 0, end ? 59 : 0) : undefined;
}

// Get meridiem strings (am / pm) as moment displays them (i.e. moment localization)
function meridiemValues() {
    const amLabel = moment('2021-12-10 09:00').format('a');
    const pmLabel = moment('2021-12-10 21:00').format('a');
    return [amLabel, pmLabel];
}

// Adjust time with  interval
function adjustTime(date, op, arg) {
    switch (arg.intervalType) {
        case 'h': date[op](arg.interval, 'hours'); break;
        case 'm': date[op](arg.interval, 'minutes'); break;
        case 's': date[op](arg.interval, 'seconds'); break;
        case 'd': date[op](arg.interval, 'days'); break;
    }
    return date;
}


PTCS.Datepicker = class extends PTCS.BehaviorTabindex(PTCS.BehaviorValidate(PTCS.BehaviorTooltip(PTCS.BehaviorFocus(
    PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))))) {

    static get template() {
        return html`
    <style>
      :host {
        display: inline-flex;
        flex-direction: column;
        align-items: stretch;
        align-content: stretch;
        width: 100%;
        box-sizing: border-box;
        overflow-y: auto;
      }

      :host([hidden]) {
        display: none;
      }

      [part=label-container] {
        display: contents;
      }

      [part=label] {
        flex: 0 0 auto;
        width: 100%;
        flex-shrink: 0;
      }

      [part=controls] {
        flex: 1 1 auto;
        display: flex;
        align-items: flex-end;
        box-sizing: border-box;
      }

      [part=date-field] {
        position: relative;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
      }

      [part=meridiem-dd] {
        height: 100%;
      }

      :host(:not([show-time])) [part=time-field] {
        display: none;
      }

      :host(:not([show-time])) [part=meridiem-dd] {
        display: none;
      }

      :host(:not([twelve-hour-clock])) [part=meridiem-dd] {
        display: none;
      }

      #calendarbutton[invisible] {
        visibility: hidden;
      }

      :host([left-menu-button]) [part=calendar-menu-button] {
        order: -1;
      }

      ptcs-textfield {
        flex: 1 1 auto;
      }

      ptcs-textfield[hidden] {
        display: none;
      }

      ptcs-dropdown[hidden] {
        display: none;
      }

      :host(:not([editing]):not([opened])[validity]) ptcs-textfield[invalid]::part(text-box),
      :host(:not([editing]):not([opened])[validity]) ptcs-dropdown[invalid]::part(select-box) {
        background: var(--ptcs-invalid-background, #FFF0F0);
        border-color: var(--ptcs-invalid-border-color, #ce3939);
        border-width: var(--ptcs-invalid-border-width, 1px);
      }

      :host(:not([editing]):not([opened])[validity=valid]) ptcs-textfield::part(text-box),
      :host(:not([editing]):not([opened])[validity=valid]) ptcs-dropdown::part(select-box) {
        background: var(--ptcs-valid-background, #EFFFEF);
        border-color: var(--ptcs-valid-border-color, #178642);
        border-width: var(--ptcs-valid-border-width, 1px);
      }

      :host(:not([opened])[validity=unvalidated]) ptcs-textfield::part(text-box),
      :host(:not([opened])[validity=unvalidated]) ptcs-dropdown::part(select-box) {
        background: var(--ptcs-unvalidated-background, #FFFFFF);
        border-color: var(--ptcs-unvalidated-border-color, #c2c7ce);
        border-width: var(--ptcs-unvalidated-border-width, 1px);
      }

    </style>

    <div part="label-container">
        <ptcs-label part="label" id="label" label="[[label]]" hidden\$="[[!label]]" disable-tooltip
            multi-line horizontal-alignment="[[labelAlignment]]"></ptcs-label>
    </div>

    <div id="controls1" part="controls">
        <ptcs-textfield id="datetext" part="date-field" label-alignment="[[labelAlignment]]" disabled="[[disabled]]"
            label="[[_label1]]" spellcheck="false"
            on-focus="_field1Focus" on-clear-text="_clearedField1" show-clear-text="[[!hideClearDate]]"
            hint-text="[[_hintText1]]" exportparts\$="[[_exportparts]]"
            tooltip="[[_tooltip]]" tooltip-icon="[[tooltipIcon]]"
            tabindex\$="[[_dfTabindex(_delegatedFocus, _noSpaceForMessage)]]"></ptcs-textfield>
        <template is="dom-if" if="[[!__hideExpandPanel]]">
        <ptcs-textfield id="datetext2" part="date-field" label-alignment="[[labelAlignment]]" disabled="[[disabled]]"
            label="[[_label2]]" spellcheck="false"
            on-focus="_field2Focus" on-clear-text="_clearedField2" show-clear-text="[[!hideClearDate]]"
            hint-text="[[_hintText2]]" tooltip="[[_tooltip]]" tooltip-icon="[[tooltipIcon]]"
            exportparts\$="[[_exportparts]]" tabindex\$="[[_dfTabindex(_delegatedFocus, _noSpaceForMessage, __hideExpandPanel)]]"></ptcs-textfield>
        <ptcs-dropdown part="meridiem-dd" id="meridiem" on-focus="_toggleEditingOnFocus" on-blur="_toggleEditingOnBlur"
            disabled="[[disabled]]" hidden\$="[[_bool(formatToken)]]"
            items="[[meridiemStrings]]" label="[[meridiemLabel]]" exportparts$="[[_exportmeridiem]]"
            on-selected-changed="_meridiemSelection" selected-value="[[_meridiemValue(_date1)]]"
            label-alignment="[[labelAlignment]]" disable-no-item-selection
            tooltip="[[_tooltip]]" tooltip-icon="[[tooltipIcon]]" mode="{{_mode}}"
            tabindex$="[[_dfTabindex(_delegatedFocus, _noSpaceForMessage, __hideExpandPanel)]]"></ptcs-dropdown>
        </template>
        <ptcs-button part="calendar-menu-button" variant="tertiary" icon="[[icon]]" icon-width="[[iconWidth]]" icon-height="[[iconHeight]]"
            id="calendarbutton" tabindex\$="[[_dfTabindex(_delegatedFocus, _noSpaceForMessage, __showBottomPanel)]]"
            disabled="[[disabled]]" on-click="_openCalendar" on-focus="_toggleEditingOnFocus" on-blur="_toggleEditingOnBlur"
            tooltip="[[_tooltip]]" tooltip-icon="[[tooltipIcon]]"
            invisible\$="[[__showBottomPanel]]"></ptcs-button>
    </div>
    <template is="dom-if" if="[[__showBottomPanel]]">
    <div id="controls2" part="controls" control2>
        <ptcs-textfield id="datetext3" part="date-field" disabled="[[disabled]]"
            label="[[toFieldLabel]]" label-alignment="[[labelAlignment]]" spellcheck="false"
            on-focus="_field3Focus" on-clear-text="_clearedField3" show-clear-text="[[!hideClearDate]]"
            tooltip="[[_tooltip]]" tooltip-icon="[[tooltipIcon]]"
            hint-text="[[_hintTextEndDate]]" exportparts\$="[[_exportparts]]"
            tabindex\$="[[_dfTabindex(_delegatedFocus, _noSpaceForMessage, __hideBottomPanel)]]"></ptcs-textfield>
        <ptcs-textfield id="datetext4" part="date-field" disabled="[[disabled]]"
            label="[[toTimeLabel]]" label-alignment="[[labelAlignment]]" spellcheck="false"
            on-focus="_field4Focus" on-clear-text="_clearedField4" show-clear-text="[[!hideClearDate]]"
            tooltip="[[_tooltip]]" tooltip-icon="[[tooltipIcon]]"
            hint-text="[[_hintText4]]" exportparts\$="[[_exportparts]]"
            tabindex\$="[[_dfTabindex(_delegatedFocus, _noSpaceForMessage, __hideBottomPanel)]]"></ptcs-textfield>
        <ptcs-dropdown part="meridiem-dd" id="meridiem2" on-focus="_toggleEditingOnFocus" on-blur="_toggleEditingOnBlur"
            items="[[meridiemStrings]]" label="[[meridiemLabel]]" exportparts$="[[_exportmeridiem]]"
            on-selected-changed="_meridiem2Selection" selected-value="[[_meridiemValue(_date2)]]"
            label-alignment="[[labelAlignment]]" disable-no-item-selection disabled="[[disabled]]"
            tooltip="[[_tooltip]]" tooltip-icon="[[tooltipIcon]]" mode="{{_mode2}}"
            tabindex$="[[_dfTabindex(_delegatedFocus, _noSpaceForMessage, __hideBottomPanel)]]"></ptcs-dropdown>
        <ptcs-button part="calendar-menu-button" variant="tertiary" icon="[[icon]]" icon-width="[[iconWidth]]" icon-height="[[iconHeight]]"
            id="calendarbutton2" tabindex\$="[[_dfTabindex(_delegatedFocus, _noSpaceForMessage, __hideBottomPanel)]]"
            tooltip="[[_tooltip]]" tooltip-icon="[[tooltipIcon]]" on-focus="_toggleEditingOnFocus" on-blur="_toggleEditingOnBlur"
            disabled="[[disabled]]" on-click="_openCalendar"></ptcs-button>
    </div>
    </template>`;

    // <ptcs-datepicker-calendar> is added on-demand by _setupCalendar
    }

    static get is() {
        return 'ptcs-datepicker';
    }

    static get properties() {
        return {
            // disabled?
            disabled: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            // Don't use the formatting based editor
            disableMaskedInput: {
                type: Boolean
            },

            _maskedInput: {
                type:     Boolean,
                computed: '_computeMaskedInput(disableMaskedInput, formatToken)'
            },

            //
            // NOTE: date, dateTime, fromDate, toDate and selectedDate are needed for backwards compatibility.
            //       All internal date manipulations uses _date1 and _date2.
            //

            // The selected date, as a string
            date: {
                type:               String,
                observer:           '_dateChanged',
                reflectToAttribute: true,
                notify:             true
            },

            // The selected date, as Date object
            dateTime: {
                type:     Date,
                notify:   true,
                observer: '_dateTimeChanged'
            },

            // The selected fromDate (for range calendar)
            fromDate: {
                type:     Date,
                notify:   true,
                observer: '_fromDateChanged'
            },

            // The selected toDate (for range calendar)
            toDate: {
                type:     Date,
                notify:   true,
                observer: '_toDateChanged'
            },

            // The selected date as a moment object or {fromDate, toDate}
            selectedDate: {
                type:   Object,
                notify: true,
                value:  () => ({})
            },


            //
            // NOTE: Actual dates directly manipulated by the datepicker
            //

            // Range picker?
            dateRangeSelection: {
                type:               Boolean,
                observer:           '_dateRangeSelectionChanged',
                reflectToAttribute: true
            },

            // Primary date of datepicker. Range start date if dateRangeSelection
            _date1: {
                type: Date
            },

            // Secondary date. Range end date if dateRangeSelection, otherwise ignored
            _date2: {
                type: Date
            },

            // Position of the calendar menu button (left or right. Default: right)
            leftMenuButton: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // button labels
            selectLabel: {
                type:  String,
                value: 'Select'
            },

            cancelLabel: {
                type:  String,
                value: 'Cancel'
            },

            monthLabel: {
                type:  String,
                value: 'Month'
            },

            yearLabel: {
                type:  String,
                value: 'Year'
            },

            // other labels
            hoursLabel: {
                type:  String,
                value: 'Hours'
            },

            minutesLabel: {
                type:  String,
                value: 'Minutes'
            },

            secondsLabel: {
                type:  String,
                value: 'Seconds'
            },

            // Datepicker icon
            icon: {
                type:  String,
                value: 'cds:icon_calendar'
            },

            iconWidth: {
                type: String
            },

            iconHeight: {
                type: String
            },

            // Labels for datepicker
            label: {
                type: String
            },

            // Label for datetext textfield
            _label1: {
                type:     String,
                computed: '_datetextLabel(dateRangeSelection, fromFieldLabel, dateLabel)'
            },

            // Label for datetext2 textfield
            _label2: {
                type:     String,
                computed: '_datetext2Label(_showTime, dateRangeSelection, fromTimeLabel, toFieldLabel, timeLabel, formatToken)'
            },

            // Tooltip filtered against the visible labels (the textfield only filters out truncated tooltip against its own label)
            _tooltip: {
                type:     String,
                // eslint-disable-next-line max-len
                computed: '_computeTooltip(tooltip, label, _label1, _label2, toFieldLabel, toTimeLabel, meridiemLabel, _twelveHourClock, _showTime, dateRangeSelection)]]'
            },

            labelAlignment: {
                type:               String,
                value:              'left',
                reflectToAttribute: true
            },

            dateLabel: {
                type: String
            },

            fromFieldLabel: {
                type: String
            },

            fromFieldHintText: {
                type: String
            },

            toFieldLabel: {
                type: String
            },

            toFieldHintText: {
                type: String
            },

            timeLabel: {
                type: String
            },

            fromTimeLabel: {
                type: String
            },

            toTimeLabel: {
                type: String
            },

            calendarStartTimeLabel: {
                type: String
            },

            calendarEndTimeLabel: {
                type: String
            },

            meridiemLabel: {
                type:  String,
                value: 'AM/PM'
            },

            // Meridiem dropdown state (open or closed)
            _mode: {
                type:     String,
                observer: '_modeChanged'
            },

            // Meridiem2 dropdown state (open or closed)
            _mode2: {
                type:     String,
                observer: '_modeChanged'
            },

            // How should the time be formatted?
            _timeFormat: {
                type:     String,
                computed: '_computeTimeFormat(_showTime, _displaySeconds, _twelveHourClock)'
            },

            // Dates are edited in numeric form in the current dateOrder using current dateDelimiter
            _editedDateFormat: {
                type:     String,
                computed: '_computeEditedDateFormat(dateOrder, dateDelimiter)'
            },

            // How should dates be formatted?
            _dateFormat: {
                type:     String,
                computed: '_computeDateFormat(_showTime, _displaySeconds, dateDelimiter, monthFormat, dateOrder, _timeFormat, formatToken)'
            },

            // Same as _dateFormat except no time part
            _dtFmtNoTime: {
                type:     String,
                computed: '_computeDateFormatWithoutTimePart(_dateFormat, formatToken)'
            },

            // Specified hint text for datepicker
            hintText: {
                type: String
            },

            // Hint to date editor is dependent on dateOrder and date delimiter
            _hintTextDate: {
                type:     String,
                computed: '_computeDateHintText(hintText, dateOrder, dateDelimiter, formatToken)'
            },

            // Hint to date editor is dependent on dateOrder and date delimiter
            _hintTextStartDate: {
                type:     String,
                computed: '_computeDateHintText(fromFieldHintText, dateOrder, dateDelimiter, formatToken)'
            },

            // Hint to date editor is dependent on dateOrder and date delimiter
            _hintTextEndDate: {
                type:     String,
                computed: '_computeDateHintText(toFieldHintText, dateOrder, dateDelimiter, formatToken)'
            },

            // Specified hint text for time editor
            timeHintText: {
                type: String
            },

            // Hint to time editor
            _hintTextTime: {
                type:     String,
                computed: '_computeTimeHintText(timeHintText, _displaySeconds)'
            },

            // Hint to start time range
            startTimeHintText: {
                type: String
            },

            _hintTextStartTime: {
                type:     String,
                computed: '_computeTimeHintText(startTimeHintText, _displaySeconds)'
            },

            // Hint to end time range
            endTimeHintText: {
                type: String
            },

            _hintTextEndTime: {
                type:     String,
                computed: '_computeTimeHintText(endTimeHintText, _displaySeconds)'
            },

            // Hint text of field1 (#datetext)
            _hintText1: {
                type:     String,
                computed: '_computeHintText1(dateRangeSelection, _hintTextStartDate, _hintTextDate)'
            },

            // Hint text of field2 (#datetext2)
            _hintText2: {
                type:     String,
                computed: '_computeHintText2(dateRangeSelection, _showTime, _hintTextTime, _hintTextStartTime, _hintTextEndDate, formatToken)'
            },

            // Hint text of field4 (#datetext4)
            _hintText4: {
                type:     String,
                computed: '_computeHintText4(dateRangeSelection, _hintTextTime, _hintTextEndTime)'
            },

            // Initialize date with current time?
            initWithCurrentDateTime: {
                type: Boolean
            },

            // Date editing in-progress? This state is used to turn off invalid border highlight on textfield during editing
            editing: {
                type:               Boolean,
                reflectToAttribute: true,
                observer:           '_editingChanged'
            },

            // Display date with time?
            showTime: {
                type:               Boolean,
                reflectToAttribute: true,
                value:              false // Boolean attributes "must" be false by default
            },

            _showTime: {
                type:     Boolean,
                computed: '_computeShowTime(showTime, formatToken)'
            },

            // 12-hour clock (AM/PM)?
            twelveHourClock: {
                type:               Boolean,
                reflectToAttribute: true
            },

            _twelveHourClock: {
                type:     Boolean,
                computed: '_computeTwelveHourClock(twelveHourClock, formatToken)'
            },

            // am / pm strings for the 12-hour clock dropdown
            meridiemStrings: {
                type:  Array,
                value: meridiemValues
            },

            // This property is nowadays only for sending !_showTime to the calendar
            _dateOnly: {
                type:     Boolean,
                computed: '_computeDateOnly(_showTime)'
            },

            // Display hh:mm:ss?
            displaySeconds: {
                type:  Boolean,
                value: false
            },

            _displaySeconds: {
                type:     Boolean,
                computed: '_computeDisplaySeconds(displaySeconds, formatToken)'
            },

            // Delimiter between date parts, as in 2021-12-08
            dateDelimiter: {
                type:  String,
                value: '-'
            },

            monthFormat: {
                type:  String,
                value: 'full' // full, short, numeric
            },

            dateOrder: {
                type:     String,
                observer: '_dateOrderChanged',
                value:    'YMD' //  auto, YMD, MDY, DMY (auto - is default format)
            },

            // Full override of format
            formatToken: {
                type: String
            },

            hideClearDate: {
                type: Boolean
            },

            // Is calendar open?
            _opened: {
                type:               Boolean,
                reflectToAttribute: true,
                observer:           '_openedChanged'
            },

            // The actual calendar (attached to <body>)
            // undefined: not ready to be configured
            // null:      ready to be configured
            __calendarObj: {
                type: HTMLElement
            },

            // First day of week
            weekStart: {
                type:  String,
                value: 'Monday'
            },

            // Create a unique ID (only for testing, I think)
            _calendarId: {
                type: String
            },

            // Type specifier for this.interval
            intervalType: {
                type:  String,
                value: 'h', //  h - Hours, m - Minutes, s - Seconds, d - Days
            },

            interval: {
                type:  Number,
                value: 0,
            },

            // The last interval that was assigned to dateTime / fromDate / endDate
            _intervalOld: {
                type: Object
            },

            yearRange: {
                type:  Number,
                value: 10,
            },

            actionPosition: {
                type:  String,
                value: ''
            },

            // FocusBehavior should simulate a click event when space is pressed
            _spaceActivate: {
                type:     Boolean,
                value:    true,
                readOnly: true
            },

            _delegatedFocus: {
                type:  String,
                value: null
            },

            daysContainingAnyData: {
                type:     Array,
                value:    () => [],
                observer: '_daysContainingAnyDataChanged'
            },

            _exportparts: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('date-field-', PTCS.Textfield)
            },

            _exportmeridiem: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('meridiem-dd-', PTCS.Dropdown)
            },

            //
            // Validation
            //

            // Client-provided custom validation function
            extraValidation: {
                type: Function
            },

            // Validation: min Date
            min: {
                type: Date
            },

            minFailureMessage: {
                type: String
            },

            // Validation: max Date
            max: {
                type: Date
            },

            maxFailureMessage: {
                type: String
            },

            minStartDate: {
                type: Date
            },

            minStartDateFailureMessage: {
                type: String
            },

            maxStartDate: {
                type: Date
            },

            maxStartDateFailureMessage: {
                type: String
            },

            minEndDate: {
                type: Date
            },

            minEndDateFailureMessage: {
                type: String
            },

            maxEndDate: {
                type: Date
            },

            maxEndDateFailureMessage: {
                type: String
            },

            maxRange: {
                type: Number
            },

            maxRangeFailureMessage: {
                type: String
            },

            // Validation: false if Date field is empty
            required: {
                type:    Boolean,
                isValue: required => !!required
            },

            requiredMessage: {
                type: String
            },

            __showBottomPanel: {
                type:     Boolean,
                computed: '_showBottomPanel(dateRangeSelection, _showTime, formatToken)'
            },

            __hideBottomPanel: {
                type: Boolean
            },

            __hideExpandPanel: {
                type:     Boolean,
                computed: '_hideExpandPanel(dateRangeSelection, _showTime, formatToken)'
            },

            // A single point for validation. Increment __validateNo to force a new validation
            __validateNo: {
                type:     Number,
                value:    0,
                // eslint-disable-next-line max-len
                validate: '_validateDatepicker(dateTime, fromDate, toDate, dateRangeSelection, _showTime, _displaySeconds, _twelveHourClock, required, min, max, minStartDate, maxStartDate, minEndDate, maxEndDate, maxRange, extraValidation)'
            }
        };
    }

    static get observers() {
        return [
            '_observeInterval(intervalType, interval)',
            '_observeInitWithCurrentDateTimeAndShowTime(initWithCurrentDateTime, _showTime)',
            '_observeRangeDate(fromDate, toDate)',
            '_field1Text(_date1, _dtFmtNoTime)',
            '_field2Text(_date1, _date2, _showTime, _twelveHourClock, _dtFmtNoTime, _timeFormat, formatToken)',
            '_field3Text(_date2, _dtFmtNoTime)',
            '_field4Text(_date2, _twelveHourClock, _timeFormat)',
            '_checkDatesConstraints(minStartDate, maxStartDate, minEndDate, maxEndDate)',
            // eslint-disable-next-line max-len
            '_configureEditor(_maskedInput, dateRangeSelection, _showTime, _dtFmtNoTime, _timeFormat, formatToken, min, max, minStartDate, maxStartDate, minEndDate, maxEndDate)'
        ];
    }

    ready() {
        super.ready();

        this.tooltipFunc = this._monitorTooltip.bind(this);

        this.__calendarObj = null; // Ready to be assigned

        if (this._stayUnvalidated === undefined) {
            this._stayUnvalidated = true;
        }

        if (this.disableMaskedInput === undefined) {
            this.disableMaskedInput = false;
        }

        // Start in editing mode, unless otheriwse specfied, to prevent (visible) validation errors
        if (this.editing === undefined) {
            this.editing = this._stayUnvalidated;
        }

        // Since hidden\$="[[!label]]" is not fired on an initial undefined value
        if (this.label === undefined) {
            this.$.label.setAttribute('hidden', '');
        }
    }

    connectedCallback() {
        super.connectedCallback();

        if (this.__calendarObj) {
            this.__calendarObj.__saSa = this.__saSa;
            document.body.appendChild(this.__calendarObj);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        if (this.__calendarObj) {
            document.body.removeChild(this.__calendarObj);
        }
    }

    get _calendar() {
        if (this.__calendarObj) {
            // Ready and available
            return this.__calendarObj;
        }
        if (this.__calendarObj === undefined) {
            // Not ready to be created
            return null;
        }
        // Set it up
        this._setupCalendar();
        console.assert(this.__calendarObj);
        return this.__calendarObj;
    }

    // eslint-disable-next-line max-len
    _computeTooltip(tooltip, label, _label1, _label2, toFieldLabel, toTimeLabel, meridiemLabel, _twelveHourClock, _showTime, dateRangeSelection) {
        if (_showTime && _twelveHourClock && tooltip === meridiemLabel) {
            return '';
        }
        if (_showTime && dateRangeSelection) {
            return tooltip !== label &&
                tooltip !== _label1 &&
                tooltip !== _label2 &&
                tooltip !== toFieldLabel &&
                tooltip !== toTimeLabel ? tooltip : '';
        } else if (dateRangeSelection || _showTime) {
            return tooltip !== label &&
                tooltip !== _label1 &&
                tooltip !== _label2 ? tooltip : '';
        } else if (tooltip === _label1) {
            return '';
        }
        return tooltip !== label ? tooltip : '';
    }

    _monitorTooltip() {
        // Filter out tooltip against a fully shown (not truncated) hint text
        if (this.dateRangeSelection && this.showTime) {
            if (!this._datetext3.hasText && this._tooltip === this._hintTextTime) {
                return '';
            }
            if (!this._datetext4.hasText && this._tooltip === this._hintTextEndDate) {
                return '';
            }
        }
        if (this.dateRangeSelection || this.showTime) {
            if (!this._datetext2.hasText && this._tooltip === this._hintText2) {
                return '';
            }
        }
        if (!this._datetext1.hasText && this._tooltip === this._hintText1) {
            return '';
        }
        return this._tooltip || '';
    }

    _getel(id) {
        const el = this.$[id];
        return el || (this.$[id] = this.shadowRoot.getElementById(id)) || {};
    }

    get _datetext1() {
        return this.$.datetext;
    }

    get _datetext2() {
        return this._getel('datetext2');
    }

    get _datetext3() {
        return this._getel('datetext3');
    }

    get _datetext4() {
        return this._getel('datetext4');
    }

    _bool(test) {
        return !!test;
    }

    _showBottomPanel(dateRangeSelection, _showTime, formatToken) {
        const show = dateRangeSelection && _showTime && !formatToken;
        this.__hideBottomPanel = !show;
        return show;
    }

    _hideExpandPanel(dateRangeSelection, _showTime, formatToken) {
        return !(formatToken ? dateRangeSelection : (dateRangeSelection || _showTime));
    }

    // The datepicker changes the public date(s)
    _setPublicDates(date1, date2) {
        if (this.__blockPublicDate) {
            // Publishing new dates is in progress. Ignore change callbacks
            return;
        }

        this.__blockPublicDate = true;
        try {
            if (this.dateRangeSelection) {
                if (date1 && date2 && date1 > date2) {
                    console.warn('Invalid range order - switching');
                    [date2, date1] = [date1, date2];
                    if (!this._showTime) {
                        // Set timestamp per calendar conventions
                        date1.setHours(0, 0, 0, 0);
                        date2.setHours(23, 59, 59, 999);
                    }
                }
                this.fromDate = updateDate(date1, this.fromDate);
                this.toDate = updateDate(date2, this.toDate);
            } else {
                this.dateTime = updateDate(date1, this.dateTime);
            }

            // The internal dates
            this._date1 = updateDate(date1, this._date1);
            this._date2 = updateDate(date2, this._date2);

            // The strange dates (strongly deprecated!)
            const twelveHourFormat = this.twelveHourClock && !this.formatToken ? ' a' : '';
            const format = this._showTime ? this._dateFormat + twelveHourFormat : this._dtFmtNoTime;

            if (this.dateRangeSelection) {
                this.selectedDate = (this.fromDate || this.toDate) ? {fromDate: moment(this.fromDate), toDate: moment(this.toDate)} : {};
                // eslint-disable-next-line no-nested-ternary
                this.date = (this.fromDate && this.toDate) // backwards compatible event
                    ? `${moment(this.fromDate).format(format)} - ${moment(this.toDate).format(format)}`
                    : ((this.fromDate || this.toDate) ? `${moment(this.fromDate || this.toDate).format(format)}` : '');
            } else {
                this.selectedDate = moment(date1);
                this.date = date1 ? this.selectedDate.format(format) : '';
            }

        } finally {
            this.__blockPublicDate = false;
        }
    }

    // Client has changed the date (text) property
    _dateChanged(date) {
        if (this.__blockPublicDate) {
            return; // Changed by datepicker itself. Ignore
        }
        if (this.dateRangeSelection) {
            return; // This property is not used in range mode
        }
        if (!date) {
            return; // Invalid. TODO: Should this really be ignored or should this reset the date? (Refactored, keeping original behavior)
        }

        if (typeof date === 'string') {
            const dateTime$ = moment(date);
            if (dateTime$.isValid() && moment(this.dateTime).format('YYYY-MM-DD') !== dateTime$.format('YYYY-MM-DD')) {
                this._setPublicDates(dateTime$.toDate());
            }
        }
    }

    _dateTimeChanged(dateTime) {
        if (this.__blockPublicDate) {
            return; // Changed by datepicker itself. Ignore
        }
        if (this.dateRangeSelection) {
            return; // This property is not used in range mode
        }
        const date = asDate(dateTime);

        if (date !== dateTime) {
            // dateTime might have been a string, a millisecond count, a moment date, etc... It _must_ be a Date though
            this.dateTime = date; // This will cause a new change callback
        } else if (date) {
            // Apply interval to dateTime and store the applied interval
            this._intervalOld = this.interval ? {intervalType: this.intervalType, interval: this.interval} : null;
            if (this._intervalOld) {
                // Slight delay for combination of initWithCurrentDateTime and in-binding of dateTime
                requestAnimationFrame(() => {
                    this._setPublicDates(adjustTime(moment(date), 'add', this._intervalOld).toDate());
                });
            } else {
                this._setPublicDates(date);
            }
        } else {
            this._setPublicDates(undefined);
        }
    }

    _fromDateChanged(fromDate) {
        if (!this.dateRangeSelection) {
            return; // This property is only used in range mode
        }
        this._fromDateChangedTimeStamp = Date.now();
        if (this.__blockPublicDate || this.__blockRangeIntervalAdjustment) {
            return; // Changed by datepicker itself. Ignore
        }
        const date = asDate(fromDate);
        if (date !== fromDate) {
            this.fromDate = date;
        } else {
            // Apply interval to date range and store the applied interval
            this._intervalOld = this.interval ? {intervalType: this.intervalType, interval: this.interval} : null;
            if (this._intervalOld) {
                this.__blockRangeIntervalAdjustment = true;
                setTimeout(() => {
                    // WAIT_RANGE_START_END_UPDATE_MS to let both end ranges to be updated. If toDate was not updated
                    // in that time window, use the already interval incremented _date2 instead of toDate (if it exists)
                    try {
                        const intervalAdjustedFromDate = adjustTime(moment(this.fromDate), 'add', this._intervalOld).toDate();
                        if (!this.toDate) {
                            this._setPublicDates(intervalAdjustedFromDate, undefined);
                        } else {
                            const startEndTimestampDiff = Math.abs(this._fromDateChangedTimeStamp - this._toDateChangedTimeStamp);
                            const intervalAdjustedToDate = this._date2 && startEndTimestampDiff > WAIT_RANGE_START_END_UPDATE_MS
                                ? this._date2
                                : adjustTime(moment(this.toDate), 'add', this._intervalOld).toDate();
                            this._setPublicDates(intervalAdjustedFromDate, intervalAdjustedToDate);
                        }
                    } finally {
                        this.__blockRangeIntervalAdjustment = false;
                    }
                }, WAIT_RANGE_START_END_UPDATE_MS);
            } else {
                // No interval adjustment
                this._setPublicDates(fromDate, fromDate && this._date2 && fromDate > this._date2 ? undefined : this._date2);
            }
        }
    }

    _toDateChanged(toDate) {
        if (!this.dateRangeSelection) {
            return; // This property is only used in range mode
        }
        this._toDateChangedTimeStamp = Date.now();
        if (this.__blockPublicDate || this.__blockRangeIntervalAdjustment) {
            return; // Changed by datepicker itself. Ignore
        }
        const date = asDate(toDate);
        if (date !== toDate) {
            this.toDate = date;
        } else {
            // Apply interval to date range and store the applied interval
            this._intervalOld = this.interval ? {intervalType: this.intervalType, interval: this.interval} : null;
            if (this._intervalOld) {
                this.__blockRangeIntervalAdjustment = true;
                setTimeout(() => {
                    // WAIT_RANGE_START_END_UPDATE_MS to let both end ranges to be updated. If fromDate was not updated
                    // in that time window, use the already interval incremented _date1 instead of fromDate (if it exists)
                    try {
                        const intervalAdjustedToDate = adjustTime(moment(this.toDate), 'add', this._intervalOld).toDate();
                        if (!this.fromDate) {
                            this._setPublicDates(undefined, intervalAdjustedToDate);
                        } else {
                            const startEndTimestampDiff = Math.abs(this._fromDateChangedTimeStamp - this._toDateChangedTimeStamp);
                            const intervalAdjustedFromDate = this._date1 && startEndTimestampDiff > WAIT_RANGE_START_END_UPDATE_MS
                                ? this._date1
                                : adjustTime(moment(this.fromDate), 'add', this._intervalOld).toDate();
                            this._setPublicDates(intervalAdjustedFromDate, intervalAdjustedToDate);
                        }
                    } finally {
                        this.__blockRangeIntervalAdjustment = false;
                    }
                }, WAIT_RANGE_START_END_UPDATE_MS);
            } else {
                // No interval adjustment
                this._setPublicDates(toDate && this._date1 && toDate < this._date1 ? undefined : this._date1, toDate);
            }
        }
    }

    _meridiemValue(date) {
        return date ? moment(date).format('a') : null;
    }

    // AM/PM change for dateTime or start of range
    _meridiemSelection(ev) {
        const selected = ev.detail.value;

        if (this._date1 && this._meridiemValue(this._date1) !== this.meridiemStrings[selected]) {
            if (selected === 0) {
                // pm => am
                this._setPublicDates(moment(this._date1).subtract(12, 'hours').toDate(), this._date2);
            } else if (selected === 1) {
                // am => pm
                this._setPublicDates(moment(this._date1).add(12, 'hours').toDate(), this._date2);
            }
        }

        this._forceValidation();
    }

    // AM/PM change for end of range
    _meridiem2Selection(ev) {
        const selected = ev.detail.value;

        if (this._date2 && this._meridiemValue(this._date2) !== this.meridiemStrings[selected]) {
            if (selected === 0) {
                // pm => am
                this._setPublicDates(this._date1, moment(this._date2).subtract(12, 'hours').toDate());
            } else if (selected === 1) {
                // am => pm
                this._setPublicDates(this._date1, moment(this._date2).add(12, 'hours').toDate());
            }
        }

        this._forceValidation();
    }

    _dateRangeSelectionChanged(/* dateRangeSelection */) {
        // Republish the public dates, so they are mapped down to the correct properties
        this._setPublicDates(this._date1, this._date2);
    }

    _dateOrderChanged(dateOrder) {
        const dtOrder = dateOrder.toUpperCase();
        this.dateOrder = dtOrder === 'AUTO' ? 'YMD' : dtOrder;
    }

    _editingChanged(editing) {
        this._stayUnvalidated = editing;
    }

    _observeRangeDate(/*fromDate, toDate*/) {
        // Debounce to let both dates be updated in order to emit a single event
        if (!this.__dateRangeUpdated) {
            this.__dateRangeUpdated = true;
            requestAnimationFrame(() => {
                this.__dateRangeUpdated = false;
                this.dispatchEvent(new CustomEvent('range-updated', {
                    bubbles:  true,
                    composed: true,
                    detail:   {fromDate: this.fromDate, toDate: this.toDate}
                }));
            });
        }
    }

    // TODO: Figure out how intervalType is supposed to work...
    _observeInterval(/*intervalType, interval*/) {
        if (!this._intervalOld) {
            return; // No old interval to subtract
        }
        if (!this.dateTime && !this.dateRangeSelection) {
            this._intervalOld = null;
            return; // No single date to adjust
        }
        if (this.dateRangeSelection && !this.fromDate && !this.toDate) {
            this._intervalOld = null;
            return; // No date range to adjust
        }
        if (this.dateRangeSelection) {
            let from;
            if (this.fromDate) {
                const fromDate$ = moment(this.fromDate);
                adjustTime(fromDate$, 'subtract', this._intervalOld);
                from = fromDate$.toDate();
            }
            let to;
            if (this.toDate) {
                const toDate$ = moment(this.toDate);
                adjustTime(toDate$, 'subtract', this._intervalOld);
                to = toDate$.toDate();
            }
            this._setPublicDates(from, to);
        } else {
            // Single date, not a date range
            const dateTime$ = moment(this.dateTime);
            adjustTime(dateTime$, 'subtract', this._intervalOld);

            // Apply date and get new interval
            this._dateTimeChanged(dateTime$.toDate());
        }
    }

    _daysContainingAnyDataChanged(newData) {
        if (this._calendar && newData.length) {
            this._calendar.datePresentedByDots = this.__parseArrayStringToSet(newData);
        }
    }

    // For some mysterious reason, the datepicker uses showTime and the calendar dateOnly (!)
    // This bridges that conceptual difference...
    _computeDateOnly(_showTime) {
        // In earlier implementation ranges did not have an explicit time (a range always spanned from start to end of a day)
        return !_showTime;
    }

    _computeEditedDateFormat(dateOrder, dateDelimiter) {
        switch (dateOrder) {
            case 'MDY':
                return 'MM' + dateDelimiter + 'DD' + dateDelimiter + 'YYYY';
            case 'DMY':
                return 'DD' + dateDelimiter + 'MM' + dateDelimiter + 'YYYY';
            case 'YMD':
            case 'AUTO':
            default:
                return 'YYYY' + dateDelimiter + 'MM' + dateDelimiter + 'DD';
        }
    }

    _computeDateHintText(hintText, dateOrder, dateDelimiter, formatToken) {
        if (hintText || hintText === '') {
            return hintText;
        }
        if (formatToken) {
            return hintFormat(formatToken);
        }
        switch (dateOrder) {
            case 'MDY':
                return 'mm' + dateDelimiter + 'dd' + dateDelimiter + 'yyyy';
            case 'DMY':
                return 'dd' + dateDelimiter + 'mm' + dateDelimiter + 'yyyy';
            case 'YMD':
            case 'auto':
            default:
                return 'yyyy' + dateDelimiter + 'mm' + dateDelimiter + 'dd';
        }
    }

    _computeTimeHintText(hintText, _displaySeconds) {
        return hintText || hintText === '' ? hintText : 'hh:mm' + (_displaySeconds ? ':ss' : '');
    }

    _computeHintText1(dateRangeSelection, _hintTextStartDate, _hintTextDate) {
        return dateRangeSelection ? _hintTextStartDate : _hintTextDate;
    }

    _computeHintText2(dateRangeSelection, _showTime, _hintTextTime, _hintTextStartTime, _hintTextEndDate, formatToken) {
        if (_showTime && !formatToken) {
            return dateRangeSelection ? _hintTextStartTime : _hintTextTime;
        }
        return _hintTextEndDate;
    }

    _computeHintText4(dateRangeSelection, _hintTextTime, _hintTextEndTime) {
        return dateRangeSelection ? _hintTextEndTime : _hintTextTime;
    }

    _computeTimeFormat(_showTime, _displaySeconds, _twelveHourClock) {
        if (!_showTime) {
            return '';
        }
        return `${_twelveHourClock ? 'hh' : 'HH'}:mm${_displaySeconds ? ':ss' : ''}`;
    }

    _computeShowTime(showTime, formatToken) {
        return formatToken ? !!formatToken.match(/h|H|m|s|S|a|A|LT|LTS|LLL|LLLL/) : showTime;
    }

    _computeDisplaySeconds(displaySeconds, formatToken) {
        return formatToken ? !!formatToken.match(/s|LTS/) : displaySeconds;
    }

    _computeTwelveHourClock(twelveHourClock, formatToken) {
        return formatToken ? !!formatToken.match(/a|A|h|LT|LTS|LLL|LLLL/) : twelveHourClock;
    }

    _computeDateFormatWithoutTimePart(_dateFormat, formatToken) {
        if (formatToken) {
            return formatToken;
        }
        return _dateFormat.indexOf(' ') !== -1 ? _dateFormat.substring(0, _dateFormat.indexOf(' ')) : _dateFormat;
    }

    _computeDateFormat(_showTime, _displaySeconds, dateDelimiter, monthFormatSpec, dateOrder, _timeFormat, formatToken) {
        if (formatToken) {
            return formatToken;
        }

        const _mflc = monthFormatSpec.toLowerCase();
        let monthFormat;
        if (_mflc === 'short') {
            monthFormat = 'MMM';
        } else if (_mflc === 'numeric') {
            monthFormat = 'MM';
        } else {
            monthFormat = 'MMMM';
        }

        const timeFormat = _showTime ? ' ' + _timeFormat : '';
        let str;
        switch (dateOrder) {
            case 'DMY':
                return `DD${dateDelimiter}${monthFormat}${dateDelimiter}YYYY${timeFormat}`;

            case 'MDY':
                return `${monthFormat}${dateDelimiter}DD${dateDelimiter}YYYY${timeFormat}`;

            case 'AUTO':
                if (_displaySeconds) {
                    str = ' LTS';
                } else {
                    str = ' LT';
                }
                str = _showTime ? str : '';
                return 'LL' + str;

            //case 'YMD':
            default:
                return `YYYY${dateDelimiter}${monthFormat}${dateDelimiter}DD${timeFormat}`;
        }
    }

    // Automatically assign the selected date to "now"?
    _observeInitWithCurrentDateTimeAndShowTime(initWithCurrentDateTime, _showTime) {
        if (!initWithCurrentDateTime) {
            return;
        }

        // eslint-disable-next-line no-nested-ternary
        let today = (_showTime ? (this._displaySeconds
            ? moment().millisecond(0)
            : moment().second(0).millisecond(0)) : moment({hour: 0})).toDate();

        if (this.dateRangeSelection) {
            this._intervalOld = this.interval ? {intervalType: this.intervalType, interval: this.interval} : null;
            if (this._intervalOld) {
                today = adjustTime(moment(today), 'add', this._intervalOld).toDate();
            }

            if (today < asDate(this.minStartDate) || today > asDate(this.maxEndDate)) {
                return; // Not in valid range
            }
            if (asDate(this.maxStartDate) < today && today < asDate(this.minEndDate)) {
                return; // In unselectable gap
            }
            const date1 = asDate(this.maxStartDate) < today ? this._date1 : today;
            const date2 = asDate(this.minEndDate) > today ? this._date2 : today;

            if (this._intervalOld) {
                this.__blockRangeIntervalAdjustment = true;
                try {
                    this._setPublicDates(date1, date2);
                } finally {
                    requestAnimationFrame(() => {
                        this.__blockRangeIntervalAdjustment = false;
                    });
                }
            } else {
                this._setPublicDates(date1, date2);
            }

        } else {
            if (today < asDate(this.min) || today > asDate(this.max)) {
                return;
            }
            this.dateTime = today;
        }
    }

    _checkDatesConstraints(minStartDate, maxStartDate, minEndDate, maxEndDate) {
        if (!this.dateRangeSelection) {
            return;
        }

        const date1 = (this._date1 < asDate(this.minStartDate) || this._date1 > asDate(this.maxStartDate)) ? undefined : this._date1;
        const date2 = (this._date2 < asDate(this.minEndDate) || this._date2 > asDate(this.maxEndDate)) ? undefined : this._date2;

        if (date1 === undefined || date2 === undefined) {
            this._setPublicDates(date1, date2);
        }
    }

    _datetextLabel(dateRangeSelection, fromFieldLabel, dateLabel) {
        return dateRangeSelection ? fromFieldLabel : dateLabel;
    }

    _datetext2Label(_showTime, dateRangeSelection, fromTimeLabel, toFieldLabel, timeLabel, formatToken) {
        if (formatToken) {
            return toFieldLabel;
        }
        if (dateRangeSelection) {
            return _showTime ? fromTimeLabel : toFieldLabel;
        }
        return timeLabel;
    }

    _setupCalendar() {
        console.assert(!this.__calendarObj);

        // NOTE: this codes preceeds createSubComponent. Maybe it should be refactored...

        // properties in calendar that should be assigned by properties in this
        const toObj = {
            date1:                      '_date1',
            date2:                      '_date2',
            weekStart:                  'weekStart',
            dateOnly:                   '_dateOnly',
            displaySeconds:             '_displaySeconds',
            yearRange:                  'yearRange',
            min:                        'min',
            max:                        'max',
            minStartDate:               'minStartDate',
            maxStartDate:               'maxStartDate',
            minEndDate:                 'minEndDate',
            maxEndDate:                 'maxEndDate',
            maxRange:                   'maxRange',
            disabled:                   'disabled',
            monthLabel:                 'monthLabel',
            yearLabel:                  'yearLabel',
            hoursLabel:                 'hoursLabel',
            minutesLabel:               'minutesLabel',
            secondsLabel:               'secondsLabel',
            meridiemLabel:              'meridiemLabel',
            selectLabel:                'selectLabel',
            cancelLabel:                'cancelLabel',
            tabIndex:                   '_delegatedFocus', // tabIndex is the browser property
            twelveHourClock:            '_twelveHourClock',
            meridiemStrings:            'meridiemStrings',
            dateRangeSelectionCalendar: 'dateRangeSelection',
            dateFormat:                 '_dateFormat',
            fromFieldLabel:             'fromFieldLabel',
            toFieldLabel:               'toFieldLabel',
            calendarStartTimeLabel:     'calendarStartTimeLabel',
            calendarEndTimeLabel:       'calendarEndTimeLabel',
            actionPosition:             'actionPosition'
        };

        // properties in calendar that should assign properties in this
        const fromObj = {
            // Preview changed date(s)
            date1: '_date1',
            date2: '_date2'
        };

        // Move calendar to <body>
        const calendar = this.__calendarObj = document.createElement('ptcs-datepicker-calendar');
        calendar.__$mainCmpnt = this; // Create link to owner in the same way as createSubComponent()
        calendar.__saSa = this.__saSa;
        calendar.setAttribute('hidden', ''); // Always start as hidden
        calendar.setAttribute('part', 'calendar');

        // Output from calendar object
        for (const srcName in fromObj) {
            const dstName = fromObj[srcName];
            calendar.addEventListener(`${window.camelToDashCase(srcName)}-changed`, ev => {
                if (!this._opened) {
                    return;
                }
                const value = ev.detail.value;
                if (ev.detail.path) {
                    this.notifyPath(ev.detail.path);
                } else if (value && value.indexSplices instanceof Array) {
                    this.notifySplices(dstName, value.indexSplices);
                } else {
                    this[dstName] = value;
                }
            });
        }

        // Input to calendar object
        for (const dstName in toObj) {
            const srcName = toObj[dstName];
            const propChanged = function(value) {
                this.__calendarObj[dstName] = value;
            };

            // Register observer
            this._createPropertyObserver(srcName, propChanged, false);

            // Initial call, if property already has a value
            if (this[srcName] !== undefined) {
                propChanged.call(this, this[srcName]);
            }
        }

        // Explicit events
        calendar.addEventListener('calendar-date-changed', this._calendarChanged.bind(this));

        this.setExternalComponentId();

        document.body.appendChild(this.__calendarObj);

        // TODO: this should be handled with a proper ptcs-style-unit
        const dropdowns = calendar.shadowRoot.querySelectorAll('ptcs-dropdown');
        for (const dd of dropdowns) {
            const cdd = document.body.querySelector('#' + dd._listId);
            const cddl = cdd ? cdd.shadowRoot.querySelector('[part=list-container]') : null;
            if (cddl) {
                cddl.style.maxHeight = '221px';
            }
        }

        if (this.daysContainingAnyData && this.daysContainingAnyData.length) {
            calendar.datePresentedByDots = this.__parseArrayStringToSet(this.daysContainingAnyData);
        }
    }

    _getDimension() {
        const controlsBoxId = `controls${this._showBottomPanel(this.dateRangeSelection, this._showTime, this.formatToken) ? 2 : 1}`;
        const dpBox = this.shadowRoot.getElementById(controlsBoxId);

        return {
            // Get window dimension
            windowWidth:  window.innerWidth,
            windowHeight: window.innerHeight,
            // Get current scroll offset
            scrollDx:     document.documentElement.scrollLeft + document.body.scrollLeft,
            scrollDy:     document.documentElement.scrollTop + document.body.scrollTop,
            // Where is the dropdown box?
            box:          dpBox.getBoundingClientRect()
        };
    }

    _diffDimension(r1, r2) {
        if (r1.windowWidth !== r2.windowWidth || r1.windowHeight !== r2.windowHeight) {
            return true;
        }
        if (r1.scrollDx !== r2.scrollDx || r1.scrollDy !== r2.scrollDy) {
            return true;
        }
        if (r1.box.top !== r2.box.top || r1.box.bottom !== r2.box.bottom || r1.box.left !== r2.box.left) {
            return true;
        }

        return false;
    }

    _setCalendarPosition(dim) {
        const calendarDim = this._calendar.getBoundingClientRect();
        let x = this.leftMenuButton ? dim.box.left : dim.box.right - calendarDim.width;
        let y = dim.box.bottom;

        if (x + calendarDim.width > dim.windowWidth) {
            x = dim.windowWidth - calendarDim.width;
        }

        if (x < 0) {
            x = 0;
        }

        if (y + calendarDim.height > dim.windowHeight) {
            y = dim.box.top - calendarDim.height - 6;
        }

        if (y < 0) {
            y = 0;
        }

        // Start at default position
        this._calendar.style.top = (y + dim.scrollDy) + 'px';
        this._calendar.style.left = (x + dim.scrollDx) + 'px';
    }

    // Keep track of calendar position, if the datepicker box is moved or the view is scrolled
    _trackPosition(rOld) {
        if (this._opened) {
            const rNew = this._getDimension();

            /* Do not move the calendar unless the browser window height is greater than the calendar height: Without this
                check, the calendar will "jump" back to the top when user tries to interact with overflowing calendar parts */
            if (rNew.windowHeight > this._calendar.clientHeight) {
                if (this._diffDimension(rOld, rNew)) {
                    this._setCalendarPosition(rNew);
                }
            }

            setTimeout(() => this._trackPosition(rNew), 500);
        }
    }

    _restorePreview() {
        if (this.dateRangeSelection) {
            this._setPublicDates(this.fromDate, this.toDate);
        } else {
            this._setPublicDates(this.dateTime);
        }
    }

    _openCalendar() {
        if (this.disabled) {
            return;
        }

        // make sure the latests dates are made available to the calendar
        this._calendar.date1 = this._date1;
        this._calendar.date2 = this._date2;
        this._opened = true;
        this.editing = true;
    }

    _openedChanged(_opened) {
        if (!this._calendar) {
            return;
        }

        PTCS.setbattr(this._calendar, 'hidden', !_opened);

        if (!_opened) {
            if (this._closeEvent) {
                document.removeEventListener('mousedown', this._closeEvent);
                this._closeEvent = null;
            }

            const button = this._getel((this._showTime && this.dateRangeSelection) ? 'calendarbutton2' : 'calendarbutton');
            if (button.focus) {
                button.focus();
            }

            this.editing = false;

            // This is really only needed when starting with an assigned date and an unassigned time, where the time is assigned to 00:00:00
            this._forceValidation();
            return;
        }

        const dim = this._getDimension();

        this._setCalendarPosition(dim);

        requestAnimationFrame(() => {
            if (!this._opened) {
                return;
            }

            if (!this._closeEvent) {
                // Close the dropdown if the user clicks anywhere outside of it
                this._closeEvent = e => {
                    if (!PTCS.isMainComponentOf(this._calendar, e.target)) {
                        // Clicked outside calendar
                        this._restorePreview();
                        this._opened = false;
                    }
                };

                // using 'mousedown' instead of 'click' due to integration problems with MUB
                document.addEventListener('mousedown', this._closeEvent);
            }

            this._trackPosition(dim);

            this._calendar.focusOnOpen();
        });

        this._calendar.gotoTime(this._date1 || new Date());

        if (this.dateRangeSelection) {
            if (this.maxRange) {
                this._calendar.maxRangeUpdateDays();
            }
            if (this._showTime && this._date2) {
                this._calendar.gotoTime2(this._date2);
            }
        }

        if (!this._date1 && !this.dateRangeSelection) {
            let newDate = new Date();
            if (this._dateOnly) {
                newDate.setHours(0, 0, 0, 0);
            }
            this._calendar.date1 = newDate;
        }
    }

    _calendarChanged(ev) {
        ev.stopPropagation();

        const {closeCalendar, date1, date2, dateSelectionCanceled} = ev.detail;

        if (dateSelectionCanceled) {
            this._restorePreview();
        } else {
            this._setPublicDates(date1, date2);
        }

        if (closeCalendar) {
            this._setPublicDates(this._date1, this._date2);
            this._opened = false;
        }
    }

    getExternalComponentId() {
        return this._calendarId;
    }

    /*
     * Sets an id for external component
       NOTE: This is a public method, used e.g. by the widget wrapper. Don't remove
     */
    setExternalComponentId(id) {
        if (id) {
            this._calendarId = id;
        } else if (!this._calendarId) {
            this._calendarId = 'ptcs-datepicker-calendar-' + performance.now().toString().replace('.', '');
        }

        if (this.__calendarObj) {
            this.__calendarObj.setAttribute('id', this._calendarId);
        }
    }

    __parseArrayStringToSet(daysContainingAnyData) {
        return Array.isArray(daysContainingAnyData) && daysContainingAnyData.reduce((set, day) => {
            const date$ = moment(day);
            if (date$.isValid()) {
                set.add(date$.format('YYYY-M-D'));
            } else {
                console.error(`Incorrect data: ${day}`);
            }
            return set;
        }, new Set());
    }

    _setDate(datetext, date) {
        if (datetext instanceof Element) {
            setDate(datetext, date);
        }
    }

    _field1Text(_date1, _dtFmtNoTime) {
        if (this._maskedInput) {
            this._setDate(this._datetext1, _date1);
        } else {
            this._datetext1.text = _date1 ? moment(_date1).format(_dtFmtNoTime) : '';
        }
    }

    _field2Text(_date1, _date2, _showTime, _twelveHourClock, _dtFmtNoTime, _timeFormat, formatToken) {
        if (this._maskedInput) {
            this._setDate(this._datetext2, (_showTime && !formatToken) ? _date1 : _date2);
        } else if (_showTime) {
            this._datetext2.text = _date1 ? moment(_date1).format(_twelveHourClock ? _timeFormat.toLowerCase() : _timeFormat) : '';
        } else {
            this._datetext2.text = _date2 ? moment(_date2).format(_dtFmtNoTime) : '';
        }
    }

    _field3Text(_date2, _dtFmtNoTime) {
        if (this._maskedInput) {
            this._setDate(this._datetext3, _date2);
        } else {
            this._datetext3.text = _date2 ? moment(_date2).format(_dtFmtNoTime) : '';
        }
    }

    _field4Text(_date2, _twelveHourClock, _timeFormat) {
        if (this._maskedInput) {
            this._setDate(this._datetext4, _date2);
        } else {
            this._datetext4.text = _date2 ? moment(_date2).format(_twelveHourClock ? _timeFormat.toLowerCase() : _timeFormat) : '';
        }
    }

    _clearedField1() {
        this._stayUnvalidated = false;
        if (this._showTime && !this.formatToken) {
            // Keep currently entered time unchanged
            const date1 = this._date1;
            const text = this._datetext2.text;
            this._setPublicDates(undefined, this._date2);
            this._datetext2.text = text;
            setDate(this._datetext2, date1);
            this._forceValidation();
        } else {
            this._setPublicDates(undefined, this._date2);
        }
    }

    _clearedField2() {
        this._stayUnvalidated = false;
        if (this._showTime) {
            if (this._date1) {
                // Reset time of affected date
                this._setPublicDates(stripTime(this._date1), this._date2);
                this._datetext2.text = ''; // Remove 'the 00:00' that we got when reseting time of current date
            } else {
                this._forceValidation();
            }
        } else if (this.dateRangeSelection) {
            this._setPublicDates(this._date1, undefined); // Reset toDate
        }
    }

    _clearedField3() {
        this._stayUnvalidated = false;
        // Keep currently entered time unchanged
        const date2 = this._date2;
        const text = this._datetext4.text;
        this._setPublicDates(this._date1, undefined);
        this._datetext4.text = text;
        setDate(this._datetext4, date2);
        this._forceValidation();
    }

    _clearedField4() {
        this._stayUnvalidated = false;
        if (this._date2) {
            // Reset time of affected date
            this._setPublicDates(this._date1, stripTime(this._date2, true));
            this._datetext4.text = ''; // Remove 'the 23:59:59' that we got when reseting time of current date
        } else {
            this._forceValidation();
        }
    }

    _computeMaskedInput(disableMaskedInput, formatToken) {
        return !!(formatToken || !disableMaskedInput);
    }

    _configureEditor(/*Lots of properties that affects the date editor*/) {
        // Give the browser some time to load all elements into the DOM
        requestAnimationFrame(() => {
            if (this._maskedInput) {
                const tolc = !this.formatToken; // To LowerCase?
                if (this.dateRangeSelection) {
                    const min1 = asDate(this.minStartDate);
                    const max1 = asDate(this.maxStartDate);
                    const min2 = asDate(this.minEndDate);
                    const max2 = asDate(this.maxEndDate);
                    if (this.formatToken) {
                        enableDatePickerEditor(this._datetext1, this.formatToken, this._date1, min1, max1, tolc);
                        enableDatePickerEditor(this._datetext2, this.formatToken, this._date2, min2, max2, tolc);
                    } else if (this._showTime) {
                        enableDatePickerEditor(this._datetext1, this._dtFmtNoTime, this._date1, stripTime(min1), stripTime(max1, true), tolc);
                        enableDatePickerEditor(this._datetext2, this._timeFormat, this._date1, min1, max1, tolc);
                        enableDatePickerEditor(this._datetext3, this._dtFmtNoTime, this._date2, stripTime(min2), stripTime(max2, true), tolc);
                        enableDatePickerEditor(this._datetext4, this._timeFormat, this._date2, min2, max2, tolc);
                    } else {
                        enableDatePickerEditor(this._datetext1, this._dtFmtNoTime, this._date1, min1, max1, tolc);
                        enableDatePickerEditor(this._datetext2, this._dtFmtNoTime, this._date2, min2, max2, tolc);
                    }
                } else {
                    const min = asDate(this.min);
                    const max = asDate(this.max);
                    if (this.formatToken) {
                        enableDatePickerEditor(this._datetext1, this.formatToken, this._date1, min, max, tolc);
                    } else {
                        enableDatePickerEditor(this._datetext1, this._dtFmtNoTime, this._date1, min, max, tolc);
                        if (this._showTime) {
                            enableDatePickerEditor(this._datetext2, this._timeFormat, this._date1, stripTime(min), stripTime(max, true), tolc);
                        }
                    }
                }
            } else {
                this.shadowRoot.querySelectorAll('ptcs-textfield').forEach(el => removeDatePickerEditor(el));
                this._field1Text(this._date1, this._dtFmtNoTime);
                this._field2Text(this._date1, this._date2, this._showTime, this._twelveHourClock,
                    this._dtFmtNoTime, this._timeFormat, this.formatToken);
                this._field3Text(this._date2, this._dtFmtNoTime);
                this._field4Text(this._date2, this._twelveHourClock, this._timeFormat);
            }
        });
    }

    // Edit a date textfield:
    // - set and restore date format, if edit format differs from display format
    // - handle Enter and Escape keys
    // - send changed data to commit function on blur
    _editField(textfield, commitName, date) {
        this._stayUnvalidated = true; // To avoid delay via _editingChanged
        this.editing = true;
        const orgText = textfield.text;
        const newText = !this._maskedInput && date instanceof Date && this._editedDateFormat !== this._dtFmtNoTime &&
                        !textfield.hasAttribute('invalid') && moment(date).format(this._editedDateFormat);

        if (newText && orgText !== newText) {
            textfield.text = newText; // Change date format so it can be edited
            textfield.performUpdate();
            textfield.selectAll();
        }

        const keyDown = ev => {
            switch (ev.key) {
                case 'Enter':
                    this.blur();
                    ev.preventDefault();
                    break;

                case 'Escape':
                    ev.target.text = orgText;
                    this.blur();
                    ev.preventDefault();
                    break;

                case 'Shift':
                case 'Tab':
                    break;
            }
        };

        textfield.addEventListener('keydown', keyDown);

        textfield.addEventListener('blur', () => {
            this.editing = false;

            textfield.removeEventListener('keydown', keyDown);

            if (this._maskedInput) {
                const datefield = hasValidDate(textfield) && getDate(textfield);
                if (!this._showTime && datefield) {
                    // Adjust timestamps coming from date editor to match convention applied from calendar
                    if (textfield.id === 'datetext') {
                        datefield.setHours(0, 0, 0, 0);
                    } else if (this.dateRangeSelection && textfield.id === 'datetext2') {
                        datefield.setHours(23, 59, 59, 999);
                    }
                }
                if (hasValidDate(textfield)) {
                    this[commitName](getDate(textfield)); // Commit changed value
                }
                if (textfield.hasText && textfield.text !== orgText) {
                    this._forceValidation();
                }
            } else if (textfield.text === newText) {
                textfield.text = orgText; // No change, restore date format
            } else if (textfield.text !== orgText) {
                this[commitName](); // Commit changed value
            }
        }, {once: true});
    }

    _modeChanged(_mode) {
        // The dropdown has focus and blur listeners. When the dropdown list is opened, the dropdown loses focus and _stayUnvalidated
        //  becomes false via _editingChanged. Set editing to true to keep the unvalidated appearance while the dropdown list is open.
        if (_mode === 'open') {
            setTimeout(() => {
                this.editing = true;
            }, 100);
        }
    }

    _toggleEditingOnFocus() {
        if (!this._opened) {
            this.editing = true;
        }
    }

    _toggleEditingOnBlur() {
        if (!this._opened) {
            this.editing = false;
        }
    }

    _field1Focus(ev) {
        this._editField(ev.target, '_field1DecodeDate', this._date1);
    }

    _field2Focus(ev) {
        // Only set edit format if textfield contains a date
        this._editField(ev.target, '_field2DecodeDate', this.dateRangeSelection && !this._showTime && this._date2);
    }

    _field3Focus(ev) {
        this._editField(ev.target, '_field3DecodeDate', this._date2);
    }

    _field4Focus(ev) {
        this._editField(ev.target, '_field4DecodeDate');
    }

    // When decoding dates from the textfields
    _decodeFullDate(dateText, timeText, meridiem, editingDate) {
        const dateFormat = editingDate ? this._editedDateFormat : this._dtFmtNoTime;

        if (!dateText) {
            // No date. This is not valid
            return invalidMomentTime;
        }

        if (!timeText) {
            // No time. Only validate date - if time is hidden
            return moment(dateText, dateFormat, true);
        }

        if (this._twelveHourClock) {
            // Hack to stop invalid 12-hour clocks, because I'm tired of trying to figure out how to make moment do this instead
            if (!valid12hourTime(timeText) || !meridiem) {
                return invalidMomentTime;
            }

            // 12-hour clock
            return moment(`${dateText} ${timeText} ${meridiem}`, `${dateFormat} ${this._timeFormat.toLowerCase()} a`, true);
        }

        // 24-hour clock
        return moment(`${dateText} ${timeText}`, `${dateFormat} ${this._timeFormat}`, true);
    }

    _combine(date, time, meridiemId) {
        const time$ = moment(time || date);
        const date$ = moment(date || time).hour(time$.hour()).minute(time$.minute()).second(time$.second());
        const meridiem = this._twelveHourClock && this._getel(meridiemId).selectedValue;
        if (!meridiem) {
            return date$.toDate();
        }
        if (date$.format('a') === meridiem) {
            return date$.toDate(); // Already has correct meridiem
        }
        const dh = date$.hours() < 12 ? 12 : -12;
        date$.add(dh, 'h');
        if (date$.format('a') !== meridiem) {
            return date$.subtract(dh, 'h').toDate(); // Some kind of error ...
        }
        return date$.toDate();
    }

    _field1DecodeDate(date) {
        if (date) {
            if (this._showTime && !this.formatToken) {
                this._setPublicDates(this._combine(date, getDate(this._datetext2), 'meridiem'), this._date2);
            } else {
                this._setPublicDates(date, this._date2);
            }
            return;
        }
        const dateText = this._datetext1.text;
        const timeText = this._showTime && this._datetext2.text;
        const meridiem = timeText && this._twelveHourClock && this._getel('meridiem').selectedValue;
        const date$ = this._decodeFullDate(dateText, timeText, meridiem, true);

        if (!dateText) {
            this._clearedField1();
        } else if (date$.isValid() && differentDates(this._date1, date$)) {
            this._setPublicDates(date$.toDate(), this._date2);
        } else {
            this._forceValidation();
        }
    }

    _field2DecodeDate(date) {
        if (!this.dateRangeSelection && !this._showTime) {
            return; // textfield2 is not used in this mode
        }
        if (date) {
            if (this.dateRangeSelection && (!this._showTime || this.formatToken)) {
                this._setPublicDates(this._date1, date);
            } else {
                this._setPublicDates(this._combine(getDate(this._datetext1), date, 'meridiem'), this._date2);
            }
            return;
        }
        if (this._showTime) {
            const dateText = this._datetext1.text;
            const timeText = this._datetext2.text;
            const meridiem = this._twelveHourClock && this._getel('meridiem').selectedValue;
            const date$ = this._decodeFullDate(dateText, timeText, meridiem);

            if (!dateText) {
                this._clearedField2();
            } else if (date$.isValid() && differentDates(this._date1, date$)) {
                this._setPublicDates(date$.toDate(), this._date2);
            } else {
                this._forceValidation();
            }
        } else if (this.dateRangeSelection) {
            const date$ = moment(this._datetext2.text, this._editedDateFormat, true);

            if (!this._datetext2.text) {
                this._clearedField2();
            } else if (date$.isValid() && differentDates(this._date2, date$.hour(23).minute(59).second(59))) {
                this._setPublicDates(this._date1, date$.toDate());
            } else {
                this._forceValidation();
            }
        }
    }

    _field3DecodeDate(date) {
        if (!this.dateRangeSelection || !this._showTime || this.formatToken) {
            return; // textfield3 is not used in this mode
        }
        if (date) {
            this._setPublicDates(this._date1, this._combine(date, getDate(this._datetext4), 'meridiem2'));
            return;
        }
        const dateText = this._datetext3.text;
        const timeText = this._showTime && this._datetext4.text;
        const meridiem = timeText && this._twelveHourClock && this._getel('meridiem2').selectedValue;
        const date$ = this._decodeFullDate(dateText, timeText, meridiem, true);

        if (!dateText) {
            this._clearedField3();
        } else if (date$.isValid() && differentDates(this._date2, date$)) {
            this._setPublicDates(this._date1, date$.toDate());
        } else {
            this._forceValidation();
        }
    }

    _field4DecodeDate(date) {
        if (!this.dateRangeSelection || !this._showTime || this.formatToken) {
            return; // textfield4 is not used in this mode
        }
        if (date) {
            this._setPublicDates(this._date1, this._combine(getDate(this._datetext3), date, 'meridiem2'));
            return;
        }

        const dateText = this._datetext3.text;
        const timeText = this._datetext4.text;
        const meridiem = this._twelveHourClock && this._getel('meridiem2').selectedValue;
        const date$ = this._decodeFullDate(dateText, timeText, meridiem);

        if (!timeText) {
            this._clearedField4();
        } else if (date$.isValid() && differentDates(this._date2, date$)) {
            this._setPublicDates(this._date1, date$.toDate());
        } else {
            this._forceValidation();
        }
    }

    _forceValidation() {
        this.__validateNo++;
    }

    _insertValidationMessage(messageElement) {
        this.defaultInsertValidationMessageForVerticalLayout(messageElement);
    }

    _dfTabindex(_delegatedFocus, _noSpaceForMessage, forceHide = false) {
        return forceHide || _noSpaceForMessage ? '-1' : _delegatedFocus;
    }

    _validDate(dateEl) {
        if (this._maskedInput) {
            return hasValidDate(dateEl, false);
        }
        return !dateEl.text || moment(dateEl.text, this._dtFmtNoTime, true).isValid();
    }

    _validTime(timeEl) {
        if (!timeEl.text) {
            return true;
        }
        if (this._maskedInput) {
            return hasValidDate(timeEl, false);
        }
        return (!this._twelveHourClock || valid12hourTime(timeEl.text)) &&
                moment(`2021-02-25 ${timeEl.text}`, `YYYY-MM-DD ${this._timeFormat}`, true).isValid();
    }

    _noValue(textfield) {
        return this._maskedInput ? !getDate(textfield) : !textfield.text;
    }

    _validateDatepicker(dateTime, fromDate, toDate, dateRangeSelection, _showTime, _displaySeconds, _twelveHourClock,
        required, min, max, minStartDate, maxStartDate, minEndDate, maxEndDate, maxRange, extraValidation) {
        let messages = [];

        // Start with true if validation is needed, otherwise undefiend
        let result = (required || (!dateRangeSelection && (min || max)) || (dateRangeSelection && maxRange) ||
            (dateRangeSelection && (minStartDate || maxStartDate || minEndDate || maxEndDate))) ? true : undefined;

        // Each field is considered valid if it is empty (at this stage)
        let datefields = {};

        datefields.datetext1 = this._validDate(this._datetext1);
        datefields.datetext2 = _showTime ? this._validTime(this._datetext2) : (!dateRangeSelection || this._validDate(this._datetext2));
        datefields.meridiem = datefields.datetext2;
        datefields.datetext3 = !(dateRangeSelection && _showTime && !this._validDate(this._datetext3));
        datefields.datetext4 = !(dateRangeSelection && _showTime && !this._validTime(this._datetext4));
        datefields.meridiem2 = datefields.datetext4;

        const datefieldVisible = datefield => datefield instanceof HTMLElement && datefield.style.display !== 'none';

        // Check if any of the given text fields are empty
        const someEmpty = (...txtFields) => txtFields.some(field => datefieldVisible(field) && (!field.hasText || field.text === field.hintText));

        // required
        if (required) {
            if ((dateRangeSelection && _showTime && someEmpty(this._datetext1, this._datetext2, this._datetext3, this._datetext4)) ||
                ((dateRangeSelection || _showTime) && someEmpty(this._datetext1, this._datetext2)) || (someEmpty(this._datetext1))) {
                messages.push(this.requiredMessage || false);
            }

            // Mark all empty textfields that should not be empty
            if (this._noValue(this._datetext1)) {
                datefields.datetext1 = false;
            }
            if (dateRangeSelection && this.formatToken && this._noValue(this._datetext2)) {
                datefields.datetext2 = false;
            }
            if (!this.formatToken) {
                if ((_showTime || dateRangeSelection) && this._noValue(this._datetext2)) {
                    datefields.datetext2 = false;
                }
                if (dateRangeSelection && _showTime && this._noValue(this._datetext3)) {
                    datefields.datetext3 = false;
                }
                if (dateRangeSelection && _showTime && this._noValue(this._datetext4)) {
                    datefields.datetext4 = false;
                }
                if (_showTime && _twelveHourClock && !this._getel('meridiem').selectedValue) {
                    datefields.meridiem = false;
                }
                if (dateRangeSelection & _showTime && _twelveHourClock && !this._getel('meridiem2').selectedValue) {
                    datefields.meridiem2 = false;
                }
            }
        }

        const formatDate = d => {
            if (!d) {
                return '';
            }

            if (this.formatToken) {
                return moment(d).format(this.formatToken);
            }

            const dateOnly = moment(d).format(this._dtFmtNoTime);

            if ((d.getHours() === 0 && d.getMinutes() === 0) || !_showTime) {
                return dateOnly;
            }

            const timeFormat = this.twelveHourClock ? `${this._timeFormat.toLowerCase()} A` : this._timeFormat;
            const timeOnly = moment(d).format(timeFormat ? timeFormat : 'HH:mm');

            return `${dateOnly} ${timeOnly}`;
        };

        const stripSeconds = val => {
            const d = new Date(val);
            return _displaySeconds ? d.setMilliseconds(0) : d.setSeconds(0, 0);
        };

        // min/max constraints
        const validateMin = (value, minvalue, field1, field2, message) => {
            const _min = minvalue instanceof Date ? minvalue : new Date(minvalue);
            const decodedMessage = PTCS.replaceStringTokens(message, {value: formatDate(_min)});

            if (value) {
                const _value = value instanceof Date ? value : new Date(value);
                const failed = decodedMessage ? decodedMessage.join() : false;

                if (stripTime(_value) < stripTime(_min)) {
                    datefields[field1] = false;

                    messages.push(failed);
                } else if (_showTime && stripSeconds(_value) < stripSeconds(_min)) {
                    if (field2) {
                        datefields[field2] = false;
                    }

                    messages.push(failed);
                }
            }
        };

        const validateMax = (value, maxvalue, field1, field2, message) => {
            const _max = maxvalue instanceof Date ? maxvalue : new Date(maxvalue);
            const decodedMessage = PTCS.replaceStringTokens(message, {value: formatDate(_max)});

            if (value) {
                const _value = value instanceof Date ? value : new Date(value);
                const failed = decodedMessage ? decodedMessage.join() : false;

                if (stripTime(_value) > stripTime(_max)) {
                    datefields[field1] = false;

                    messages.push(failed);
                } else if (_showTime && stripSeconds(_value) > stripSeconds(_max)) {
                    if (field2) {
                        datefields[field2] = false;
                    }

                    messages.push(failed);
                }
            }
        };

        const validateRange = (valueFrom, valueTo, valueRange, field1, field2, message) => {
            const _valueFrom = stripTime(valueFrom instanceof Date ? valueFrom : new Date(valueFrom));
            const _valueTo = stripTime(valueTo instanceof Date ? valueTo : new Date(valueTo));
            const decodedMessage = PTCS.replaceStringTokens(message, {value: valueRange});
            const failed = decodedMessage ? decodedMessage.join() : false;
            const valueRangeTH = valueRange * 86400000;// 1000 (ms) * 60 (sec) * 60 (min) * 24 (hour)

            if ((_valueTo - _valueFrom) > valueRangeTH) {
                datefields[field1] = false;
                datefields[field2] = false;
                messages.push(failed);
            }
        };

        if (dateRangeSelection) {
            if (minStartDate) {
                validateMin(fromDate, minStartDate, 'datetext1', 'datetext2', this.minStartDateFailureMessage);
            }

            if (maxStartDate) {
                validateMax(fromDate, maxStartDate, 'datetext1', 'datetext2', this.maxStartDateFailureMessage);
            }

            if (minEndDate) {
                validateMin(toDate, minEndDate, _showTime ? 'datetext3' : 'datetext2', _showTime ? 'datetext4' : '', this.minEndDateFailureMessage);
            }

            if (maxEndDate) {
                validateMax(toDate, maxEndDate, _showTime ? 'datetext3' : 'datetext2', _showTime ? 'datetext4' : '', this.maxEndDateFailureMessage);
            }

            if (maxRange && fromDate && toDate) {
                validateRange(fromDate, toDate, maxRange, 'datetext1', _showTime ? 'datetext3' : 'datetext2', this.maxRangeFailureMessage);
            }
        } else {
            if (min) {
                validateMin(dateTime, min, 'datetext1', 'datetext2', this.minFailureMessage);
            }

            if (max) {
                validateMax(dateTime, max, 'datetext1', 'datetext2', this.maxFailureMessage);
            }
        }

        const _set = (el, bvalue) => (el && PTCS.setbattr(el, 'invalid', bvalue));
        const setinvalid = (id, bvalue) => _set(this.shadowRoot.getElementById(id), bvalue);

        // Mark each field
        setinvalid('datetext', !datefields.datetext1);
        setinvalid('datetext2', !datefields.datetext2);
        setinvalid('meridiem', !datefields.datetext2 || !datefields.meridiem);
        setinvalid('datetext3', !datefields.datetext3);
        setinvalid('datetext4', !datefields.datetext4);
        setinvalid('meridiem2', !datefields.datetext4 || !datefields.meridiem2);

        if (messages.length) {
            return messages;
        }

        // If any textfield is invalid, then the validation must fail
        if (!datefields.datetext1 || !datefields.datetext2 || !datefields.meridiem || !datefields.datetext3 || !datefields.datetext4 ||
            !datefields.meridiem2) {
            return false;
        }

        // Not yet invalid. Leave final say to custom validation, if any
        return typeof extraValidation === 'function' ? extraValidation(this) : result;
    }
};

customElements.define(PTCS.Datepicker.is, PTCS.Datepicker);
