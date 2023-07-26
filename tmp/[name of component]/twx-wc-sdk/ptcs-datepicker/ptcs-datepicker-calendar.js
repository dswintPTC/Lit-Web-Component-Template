import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import '@polymer/polymer/lib/elements/dom-if.js';
import 'ptcs-hbar/ptcs-hbar.js';
import 'ptcs-vbar/ptcs-vbar.js';
import 'ptcs-button/ptcs-button.js';
import 'ptcs-icons/cds-icons.js';
import 'ptcs-textfield/ptcs-textfield.js';
import 'ptcs-dropdown/ptcs-dropdown.js';
import 'ptcs-combobox/ptcs-combobox.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-focus/ptcs-behavior-focus.js';
import moment from 'ptcs-moment/moment-import.js';

/* eslint-disable no-confusing-arrow */

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

PTCS.DatepickerCalendar = class extends PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {
    static get template() {
        return html`
    <style>
      :host {
        display: inline-block;
        position: absolute;
        z-index: 99996;
      }

      :host([hidden]) {
        display: none;
      }

      /* Unthemable (without a part name...) */
      [part=datepicker-container] #divider {
        width: 285px;
        border: 0;
        border-top: 1px solid #d8d8de;
        margin-top: 16px;
      }

      [part=weekdays] {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
      }

      [part=weekday] {
        box-sizing: border-box;
        user-select: none;
      }

      [part=days] {
        flex-grow: 1;
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        user-select: none;
      }

      [part=day] {
        display: flex;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        text-transform: none;
      }

      [part=days][any-data] [part=day] {
        flex-direction: column;
      }

      [part=day] {
        cursor: pointer;
      }

      [part=day][disabled] {
        cursor: default;
      }

      [part=day][out-of-range] {
        cursor: not-allowed;
      }

      /* Ugly hack to increase button hit area */
      .add-hit-area {
        min-height: 34px;
        min-width: 34px;
        align-self: center;
        margin-top: 20px;
      }
      .add-hit-area ptcs-button {
        margin: 8px;
      }

      [part=prev-month-button],
      [part=next-month-button] {
        flex: none;
      }

      [date-only] [part=time] {
        display: none !important;
      }

      [part~=month-dropdown] {
        width: calc(100% + 30px);
        margin: 4px;
      }

      [part~=year-dropdown] {
        width: calc(100% - 30px);
        margin: 4px;
      }

      [part~=hour-dropdown],
      [part~=minute-dropdown],
      [part~=second-dropdown],
      [part~=meridiem-dropdown] {
        width: 100%;
      }

      [hide-seconds] [part~="second-dropdown"] {
        margin: 0px;
        display: none
      }

      ptcs-hbar.reverse {
        flex-direction: row-reverse !important;
        justify-content: flex-start !important;
      }

      [part=header] {
        display: flex;
        flex-flow: row nowrap;
        place-content: center space-between;
        align-items: flex-end;
      }

      [part=time-controls] {
        display: flex;
        flex-flow: row nowrap;
        place-content: center flex-start;
        align-items: flex-end;
      }

      [part=time] {
        align-items: stretch !important;
      }

      [part=day] [part=dot] {
        visibility: hidden;
      }

      [part=day] [part=dot][visible] {
        visibility: visible;
      }

      [part=days][any-data] [part=day] [part=dot] {
        display: block;
      }

      [part=dot] {
        display: none;
      }

      :host(:not([twelve-hour-clock])) [part~=meridiem-dropdown] {
        display: none;
      }
    </style>
    <div part="datepicker-container" date-only\$="[[dateOnly]]" hide-seconds\$="[[!displaySeconds]]">
      <div part="header">
        <div class="add-hit-area" on-click="_previousMonthClick">
            <ptcs-button variant="small" icon="[[iconBackward]]" part="prev-month-button" id="prev"
            tabindex\$="[[_delegatedFocus]]"></ptcs-button>
        </div>
        <ptcs-combobox part="month-dropdown time-units-label" id="currmonth" items="[[_months]]" text="{{_selectedMonth}}"
            label="[[monthLabel]]" exportparts\$="[[_exportmonth]]" selector="name" disable-no-item-selection
            type-ahead tabindex\$="[[_delegatedFocus]]"></ptcs-combobox>
        <ptcs-combobox part="year-dropdown time-units-label" id="curryear" items="[[_years]]" text="{{_selectedYear}}"
            label="[[yearLabel]]" selector="name" value-selector="year" exportparts\$="[[_exportyear]]"
            no-matches-label="" type-ahead value-input disable-no-item-selection tabindex\$="[[_delegatedFocus]]"></ptcs-combobox>
        <div class="add-hit-area" on-click="_nextMonthClick">
            <ptcs-button variant="small" icon="[[iconForward]]" part="next-month-button" id="next"
            tabindex\$="[[_delegatedFocus]]"></ptcs-button>
        </div>
      </div>
      <div id="weekdays" part="weekdays">
        <template is="dom-repeat" items="{{_weekdays}}">
          <ptcs-label part="weekday" label="[[item]]" horizontal-alignment="center"></ptcs-label>
        </template>
      </div>
      <div part="days" id="days" tabindex\$="[[_delegatedFocus]]" any-data\$="[[_anyData(datePresentedByDots)]]"
        on-mousedown="_selectDay" on-dblclick="_setDay">
        <template id="daysTemplate" is="dom-repeat" items="{{_days}}">
          <div part="day" selected\$="[[item.selected]]" range\$="[[item.range]]" out-of-range\$="[[item.outOfRange]]"
              disabled\$="[[item.disabled]]">[[item.date]]
            <span part="dot" visible\$="[[item.data]]"></span>
          </div>
        </template>
      </div>
      <ptcs-vbar part="time">
        <ptcs-label label="[[calendarStartTimeLabel]]" part="start-time-label"
          hidden\$="[[_calendarStartTimeLabelHidden(dateRangeSelectionCalendar, dateOnly, calendarStartTimeLabel)]]"></ptcs-label>
        <div part="time-controls">
          <ptcs-combobox part="hour-dropdown time-units-label" label="[[hoursLabel]]" id="currhour" items="[[_hours]]"
            type-ahead text="{{_selectedHour}}" selector="displayName"
            disable-no-item-selection exportparts\$="[[_exporthour]]" tabindex\$="[[_delegatedFocus]]"></ptcs-combobox>
          <ptcs-combobox part="minute-dropdown time-units-label" label="[[minutesLabel]]" id="currminute" items="[[_minutes]]"
            type-ahead text="{{_selectedMinute}}" selector="displayName"
            disable-no-item-selection exportparts\$="[[_exportminute]]" tabindex\$="[[_delegatedFocus]]"></ptcs-combobox>
          <ptcs-combobox part="second-dropdown time-units-label" label="[[secondsLabel]]" id="currsecond" items="[[_seconds]]"
            type-ahead text="{{_selectedSecond}}" selector="displayName"
            disable-no-item-selection exportparts\$="[[_exportsecond]]" tabindex\$="[[_delegatedFocus]]"></ptcs-combobox>
          <ptcs-combobox part="meridiem-dropdown time-units-label" id="meridiem" items="[[meridiemStrings]]" text="{{_selectedMeridiem}}"
            type-ahead label="[[meridiemLabel]]" exportparts$="[[_exportmeridiem]]" disable-no-item-selection
            tabindex$="[[_delegatedFocus]]"></ptcs-combobox>
        </div>
        <template is="dom-if" if="[[_datetimerangepicker(dateRangeSelectionCalendar, dateOnly)]]">
          <ptcs-label label="[[calendarEndTimeLabel]]" part="end-time-label"></ptcs-label>
          <div part="time-controls">
            <ptcs-combobox part="hour-dropdown time-units-label" label="[[hoursLabel]]" id="currhour2" items="[[_hours]]"
              type-ahead text="{{_selectedHour2}}" selector="displayName" hint-text="hh"
              disable-no-item-selection exportparts\$="[[_exporthour]]" tabindex\$="[[_delegatedFocus]]"></ptcs-combobox>
            <ptcs-combobox part="minute-dropdown time-units-label" label="[[minutesLabel]]" id="currminute2" items="[[_minutes]]"
              type-ahead text="{{_selectedMinute2}}" selector="displayName" hint-text="mm"
              disable-no-item-selection exportparts\$="[[_exportminute]]" tabindex\$="[[_delegatedFocus]]"></ptcs-combobox>
            <ptcs-combobox part="second-dropdown time-units-label" label="[[secondsLabel]]" id="currsecond2" items="[[_seconds]]"
              type-ahead text="{{_selectedSecond2}}" selector="displayName" hint-text="ss"
              disable-no-item-selection exportparts\$="[[_exportsecond]]" tabindex\$="[[_delegatedFocus]]"></ptcs-combobox>
            <ptcs-combobox part="meridiem-dropdown time-units-label" id="meridiem2" items="[[meridiemStrings]]" text="{{_selectedMeridiem2}}"
              type-ahead label="[[meridiemLabel]]" exportparts$="[[_exportmeridiem]]" disable-no-item-selection hint-text=""
              tabindex$="[[_delegatedFocus]]"></ptcs-combobox>
          </div>
        </template>
        <div>
          <hr id="divider" noshade>
        </div>
      </ptcs-vbar>
      <ptcs-hbar part="footer" end class\$="[[_clsButtons(actionPosition)]]">
        <ptcs-button variant="primary" exportparts\$="[[_exportapply]]" part="apply-button" on-click="_submit"
        label="[[selectLabel]]" tabindex\$="[[_delegatedFocus]]"
        disabled\$="[[!_isFromAndToSelected(dateRangeSelectionCalendar, _date1, _date2)]]"></ptcs-button>
        <ptcs-button label="[[cancelLabel]]" variant="tertiary" part="cancel-button" on-click="_cancel"
        exportparts\$="[[_exportcancel]]" tabindex\$="[[_delegatedFocus]]"></ptcs-button>
      </ptcs-hbar>
    </div>`;
    }

    static get is() {
        return 'ptcs-datepicker-calendar';
    }

    static get properties() {
        return {
            // Select single date or range of dates?
            dateRangeSelectionCalendar: {
                type: Boolean
            },

            // Primary date: selected date or range start date (when dateRangeSelectionCalendar)
            date1: {
                type:     Date,
                notify:   true,
                observer: '_date1Changed'
            },

            // Secondary date: End range date (when dateRangeSelectionCalendar, otherwise ignored)
            date2: {
                type:     Date,
                notify:   true,
                observer: '_date2Changed'
            },

            // Internal work-in-progress copies of date1 and date2
            _date1: Date,
            _date2: Date,

            initialize: {
                type: Boolean
            },

            disabled: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            // Calendar data
            _weekdays: {
                type:     Array,
                computed: '_computeWeekDaysName(weekStart)'
            },

            _days: {
                type:  Array,
                value: () => []
            },

            _years: {
                type:  Array,
                value: []
            },

            _months: {
                type:     Array,
                computed: '_computeMonths(initialize)'
            },

            _hours: {
                type:  Array,
                value: []
            },

            _minutes: {
                type:     Array,
                computed: '_computeMinutes(initialize)'
            },

            _seconds: {
                type:     Array,
                computed: '_computeSeconds(initialize)'
            },

            _selectedYear: {
                type: String
            },

            _selectedMonth: {
                type: String
            },

            _selectedHour: {
                type: String
            },

            _selectedMinute: {
                type: String
            },

            _selectedSecond: {
                type: String
            },

            _selectedHour2: {
                type: String
            },

            _selectedMinute2: {
                type: String
            },

            _selectedSecond2: {
                type: String
            },

            _focusedDay: {
                type: Number
            },

            // AM/PM 12-hour clock?
            twelveHourClock: {
                type:               Boolean,
                observer:           '_twelveHourClockChanged',
                reflectToAttribute: true
            },

            // am / fm indication of the calendar (when twelveHourClock is true)
            _selectedMeridiem: {
                type: String
            },

            _selectedMeridiem2: {
                type: String
            },

            // am / pm meridiemStrings for the 12-hour clock dropdown
            meridiemStrings: {
                type: Array
            },

            // Show only date - or show time too?
            dateOnly: {
                type:  Boolean,
                value: true
            },

            displaySeconds: {
                type:               Boolean,
                reflectToAttribute: true
            },

            yearRange: {
                type:  Number,
                value: 10,
            },

            minStartDate: {
                type: Date
            },

            maxStartDate: {
                type: Date
            },

            minEndDate: {
                type: Date
            },

            maxEndDate: {
                type: Date
            },

            maxRange: {
                type: Number
            },

            actionPosition: {
                type:  String,
                value: 'left'
            },

            weekStart: {
                type:  String,
                value: 'Monday'
            },

            iconBackward: {
                type:  String,
                value: 'cds:icon_chevron_left_mini'
            },

            iconForward: {
                type:  String,
                value: 'cds:icon_chevron_right_mini'
            },

            _delegatedFocus: {
                type:  String,
                value: null
            },

            // buttons
            selectLabel: {
                type: String
            },

            cancelLabel: {
                type: String
            },

            monthLabel: {
                type: String
            },

            yearLabel: {
                type: String
            },

            hoursLabel: {
                type: String
            },

            minutesLabel: {
                type: String
            },

            secondsLabel: {
                type: String
            },

            meridiemLabel: {
                type: String
            },

            calendarStartTimeLabel: {
                type: String
            },

            calendarEndTimeLabel: {
                type: String
            },

            datePresentedByDots: {
                type: Set
            },

            _exportmonth: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('month-dropdown-', PTCS.ComboBox)
            },

            _exportyear: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('year-dropdown-', PTCS.ComboBox)
            },

            _exporthour: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('hour-dropdown-', PTCS.ComboBox)
            },

            _exportminute: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('minute-dropdown-', PTCS.ComboBox)
            },

            _exportsecond: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('second-dropdown-', PTCS.ComboBox)
            },

            _exportmeridiem: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('meridiem-dropdown-', PTCS.ComboBox)
            },

            _exportapply: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('apply-button-', PTCS.Button)
            },

            _exportcancel: {
                type:     String,
                readOnly: true,
                value:    PTCS.exportparts('cancel-button-', PTCS.Button)
            }
        };
    }

    static get observers() {
        return [
            // eslint-disable-next-line max-len
            '_daysChanged(_selectedYear, _selectedMonth, datePresentedByDots, dateRangeSelectionCalendar, min, max, minStartDate, maxStartDate, minEndDate, maxEndDate, maxRange)',
            '_datesChanged(initialize, dateRangeSelectionCalendar, _date1, _date2)',
            '_timeChanged(initialize, _selectedHour, _selectedMinute, _selectedSecond, _selectedMeridiem)',
            '_time2Changed(initialize, _selectedHour2, _selectedMinute2, _selectedSecond2, _selectedMeridiem2)',
            // eslint-disable-next-line max-len
            '_computeYears(initialize, _selectedYear, yearRange, dateRangeSelectionCalendar, min, max, minStartDate, maxStartDate, minEndDate, maxEndDate)',
            '_computeHours(initialize)'
        ];
    }

    ready() {
        super.ready();

        const date = this.date1 || moment().set({hour: 0, minute: 0, second: 0, millisecond: 0}).toDate();

        this.gotoTime(date);

        if (!this.date1 && !this.dateRangeSelectionCalendar) {
            this.date1 = date; // In single date selection mode, we want a selected day
        }

        this.addEventListener('keydown', this._keyDown.bind(this));

        this._trackFocus(this.$.days, () => this._focusedDay >= 0 ? this.$.days.children[this._focusedDay] : null);

        this.initialize = true;
    }

    _clsButtons(actionPosition) {
        return actionPosition.toLowerCase() === 'right' ? 'reverse' : '';
    }

    _anyData(datePresentedByDots) {
        return datePresentedByDots && datePresentedByDots.size;
    }

    _date1Changed(date1) {
        if (this._date1 === date1) {
            return;
        }
        this._date1 = date1;
    }

    _date2Changed(date2) {
        if (date2) {
            const d2 = x => x < 10 ? `0${Number(x)}` : x;
            const hours = `${d2(date2.getHours())}`;
            const minutes = `${d2(date2.getMinutes())}`;
            if (this._currhour2.selected !== hours || this._currminute2.selected !== minutes) {
                this.gotoTime2(date2);
            }
        } else {
            // Reset the End time dropdown selections
            this._date2Clear();
        }
        if (this._date2 === date2) {
            return;
        }
        this._date2 = date2;
    }

    capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    get firstFocusable() {
        return this.$.prev;
    }

    get lastFocusable() {
        return this.shadowRoot.querySelector('[part=cancel-button]');
    }

    focusOnOpen() {
        const _focusedDaySelected = this._days.findIndex(d => d.selected);
        this._focusedDay = _focusedDaySelected !== -1 ? _focusedDaySelected : this._days.findIndex(d => !d.disabled);
        this.$.days.focus();
    }

    _getDate$(year, month, day, hour = 0, minute = 0, second = 0, meridiem = false) {
        const d2 = x => x < 10 ? `0${Number(x)}` : x;
        const date = `${year}-${d2(month)}-${d2(day)}`;
        const format = 'YYYY-MMMM-DD';

        if (this.dateOnly) {
            return moment(date, format, true);
        }

        if (meridiem && hour === 0) {
            hour = 12; // Just in case...
        }

        const [hh, am, a] = meridiem ? ['hh', ` ${meridiem}`, ' a'] : ['HH', '', ''];
        const time = `${d2(hour)}:${d2(minute)}`;

        const r = this.displaySeconds
            ? moment(`${date} ${time}:${d2(second)}${am}`, `${format} ${hh}:mm:ss${a}`, true)
            : moment(`${date} ${time}${am}`, `${format} ${hh}:mm${a}`, true);

        if (r.isValid()) {
            return r;
        }

        // The date is not valid?
        throw this.displaySeconds
            ? `${date} ${time}:${d2(second)}${am} + ${format} ${hh}:mm:ss${a}`
            : `${date} ${time}${am} + ${format} ${hh}:mm${a}`;
    }

    _getSelectedMonth$() {
        return this._getDate$(this._selectedYear, this._selectedMonth, 1);
    }

    _getSelectedDate$(ixDay) {
        const day = this._days[ixDay].date || 1;
        if (this.dateOnly) {
            return this._getDate$(this._selectedYear, this._selectedMonth, day);
        }
        if (this.dateRangeSelectionCalendar && !this.dateOnly && this._date1) {
            // Date time range picker, _date1 already exists, we are selecting the end range date - retrieve End Time settings.
            if (this._selectedHour2 && this._selectedMinute2) {
                return this._getDate$(this._selectedYear, this._selectedMonth, day,
                    this._selectedHour2, this._selectedMinute2, this._selectedSecond2, this.twelveHourClock && this._selectedMeridiem2);
            }
        }
        return this._getDate$(this._selectedYear, this._selectedMonth, day,
            this._selectedHour, this._selectedMinute, this._selectedSecond, this.twelveHourClock && this._selectedMeridiem);
    }

    gotoTime(date) {
        this._settingTimeDropdowns = true;
        const m = moment(date);
        this.setProperties({
            _selectedYear:     m.format('YYYY'),
            _selectedMonth:    m.format('MMMM'),
            _selectedHour:     m.format(this.twelveHourClock ? 'hh' : 'HH'),
            _selectedMinute:   m.format('mm'),
            _selectedSecond:   m.format('ss'),
            _selectedMeridiem: m.format('a')
        });
        this._settingTimeDropdowns = false;
    }

    gotoTime2(date) {
        this._settingTimeDropdowns = true;
        const m = moment(date);
        this.setProperties({
            _selectedYear:      m.format('YYYY'),
            _selectedMonth:     m.format('MMMM'),
            _selectedHour2:     m.format(this.twelveHourClock ? 'hh' : 'HH'),
            _selectedMinute2:   m.format('mm'),
            _selectedSecond2:   m.format('ss'),
            _selectedMeridiem2: m.format('a')
        });
        this._settingTimeDropdowns = false;
    }

    maxRangeUpdateDays() {
        this._daysChanged(this._selectedYear, this._selectedMonth, this.datePresentedByDots);
    }

    static range(start, end, type) {
        let data = [];
        const name = type.name;
        const curr = moment({name: start});
        for (let i = start; i <= end; i++) {
            curr.set(name, i);
            data.push({name: curr.format(type.format), year: `${i}`});
        }
        return data;
    }

    static rangeTime(start, end, type) {
        let data = [];
        const curr = moment({hour: 0});
        for (let i = start; i <= end; i++) {
            curr.set(type.name, i);
            data.push({name: i, displayName: curr.format(type.format)});
        }
        return data;
    }

    _expandYears(start, end) {
        if (start > end) {
            return undefined; // Better safe than sorry
        }
        const format = {name: 'year', format: 'YYYY'};
        const d = (date, alt) => date instanceof Date ? date.getFullYear() : alt;
        const numExpected = 1 + 2 * this.yearRange;
        const needMore = () => end - start + 1 < numExpected;

        // Min / max for whole range
        const min = d(asDate(this.dateRangeSelectionCalendar ? this.minStartDate : this.min), Number.MIN_SAFE_INTEGER);
        const max = d(asDate(this.dateRangeSelectionCalendar ? this.maxEndDate : this.max), Number.MAX_SAFE_INTEGER);
        const limited = min < max;

        // Gap limit
        const max1 = d(asDate(this.dateRangeSelectionCalendar && this.maxStartDate));
        const min2 = d(asDate(this.dateRangeSelectionCalendar && this.minEndDate));

        if (max1 < min2) {
            if (start > max1 && start < min2) {
                start = max1;
            }
            if (end > max1 && end < min2) {
                end = min2;
            }
            // The configuration defines a gap
            const hasGap = () => start <= max1 && min2 <= end;
            const needMoreEx = () => hasGap() ? end - start - min2 + max1 + 2 < numExpected : needMore();

            while (needMoreEx() && (!limited || start > min || end < max)) {
                if (!limited || start > min) {
                    if (start === min2) {
                        start = max1; // Jump over gap
                    } else {
                        start--;
                    }
                }
                if ((!limited || end < max) && needMoreEx()) {
                    if (end === max1) {
                        end = min2; // Jump over gap
                    } else {
                        end++;
                    }
                }
            }
            if (hasGap()) {
                return [...PTCS.DatepickerCalendar.range(start, max1, format), ...PTCS.DatepickerCalendar.range(min2, end, format)];
            }
        } else if (limited) {
            while (needMore() && (start > min || end < max)) {
                if (start > min) {
                    start--;
                }
                if (end < max && needMore()) {
                    end++;
                }
            }
        } else {
            // No limit - should not happen
            while (needMore()) {
                start--;
                if (needMore()) {
                    end++;
                }
            }
        }
        return PTCS.DatepickerCalendar.range(start, end, format);
    }

    _generateYears() {
        const _year = Number(this._selectedYear);
        if (isNaN(_year)) {
            return undefined;
        }

        const y = date => date instanceof Date ? date.getFullYear() : undefined;
        const d1 = (date, alt) => y(date) > alt ? y(date) : alt;
        const d2 = (date, alt) => y(date) < alt ? y(date) : alt;
        const min = d1(asDate(this.dateRangeSelectionCalendar ? this.minStartDate : this.min), Number.MIN_SAFE_INTEGER);
        const max = d2(asDate(this.dateRangeSelectionCalendar ? this.maxEndDate : this.max), Number.MAX_SAFE_INTEGER);
        const year = Math.min(Math.max(_year, min), max);
        return this._expandYears(Math.max(min, year - this.yearRange), Math.min(max, year + this.yearRange));
    }

    _computeYears(initialize, _selectedYear) {
        if (!initialize || !_selectedYear) {
            return;
        }

        requestAnimationFrame(() => {
            const newYears = this._generateYears();
            if (!Array.isArray(newYears) || PTCS.sameArray(newYears, this._years, (a, b) => a.name === b.name)) {
                return;
            }
            this._years = newYears;
        });
    }

    _computeMonths(initialize) {
        return initialize ? moment.localeData().months().map((m => ({name: m}))) : [];
    }

    _computeHours(initialize) {
        if (!initialize) {
            return;
        }

        this._hours = this.twelveHourClock
            ? PTCS.DatepickerCalendar.rangeTime(1, 12, {name: 'hour', format: 'hh'})
            : PTCS.DatepickerCalendar.rangeTime(0, 23, {name: 'hour', format: 'HH'});
    }

    _computeMinutes(initialize) {
        return !initialize ? [] : PTCS.DatepickerCalendar.rangeTime(0, 59, {name: 'minute', format: 'mm'});
    }

    _computeSeconds(initialize) {
        return !initialize ? [] : PTCS.DatepickerCalendar.rangeTime(0, 59, {name: 'second', format: 'ss'});
    }

    _computeWeekDaysName(weekStart) {
        // The chinese weekday strings each consist of three Unicode chars, the two first being identical. So just
        // displaying the first char of these doesn't work, we have to use the last one instead...
        const useLastChar = ['zh-tw', 'zh-cn'].indexOf(moment.locale()) !== -1;
        const weekDays = moment.weekdays().map(day => this.capitalize(useLastChar ? day.slice(-1) : day.slice(0, 1)));
        return weekStart.toLowerCase() === 'monday' ? [...weekDays.slice(1), weekDays[0]] : weekDays;
    }

    _outOfRangeFunc() {
        if (this.dateRangeSelectionCalendar) {
            const min1 = this.minStartDate && moment(this.minStartDate).startOf('day');
            const max1 = this.maxStartDate && moment(this.maxStartDate).endOf('day');
            const min2 = this.minEndDate && moment(this.minEndDate).startOf('day');
            const max2 = this.maxEndDate && moment(this.maxEndDate).endOf('day');
            // eslint-disable-next-line no-nested-ternary
            const maxRangeDate = this.maxRange && (!this._date1 && this._date2 ? this._date2 : (this._date1 && !this._date2 ? this._date1 : null));
            const maxRangeMin = moment(maxRangeDate).subtract(this.maxRange - 1, 'days').startOf('day');
            const maxRangeMax = moment(maxRangeDate).add(this.maxRange - 1, 'days').endOf('day');

            if (maxRangeDate ||
               ((min1 || max1 || min2 || max2) && (!min1 || !max2 || min1.isBefore(max2)) && (!max1 || !min2 || max1.isBefore(min2)))) {
                return day => {
                    // Outside of max range?
                    if (maxRangeDate && (day.isBefore(maxRangeMin) || day.isAfter(maxRangeMax))) {
                        return true;
                    }
                    // Outside of full range?
                    if ((min1 && day.isBefore(min1)) || (max2 && day.isAfter(max2))) {
                        return true;
                    }
                    // Inside the unselectable range?
                    if (max1 && min2 && day.isAfter(max1) && day.isBefore(min2)) {
                        return true;
                    }
                    return false;
                };
            }
        } else {
            const min = this.min && moment(this.min).startOf('day');
            const max = this.max && moment(this.max).endOf('day');
            if ((min || max) && (!min || !max || min.isBefore(max))) {
                return day => (min && day.isBefore(min)) || (max && day.isAfter(max));
            }
        }
        return () => false; // No days are out of range
    }

    // Changed month: need to regenerate the days element of the calendar
    _daysChanged(_selectedYear, _selectedMonth, datePresentedByDots) {
        if (!_selectedYear || !_selectedMonth) {
            return;
        }
        const currentDay = this._getDate$(_selectedYear, _selectedMonth, 1);
        const month = currentDay.month();
        const firstDayOfWeek = this.weekStart.toLowerCase() === 'monday' ? currentDay.isoWeekday(1).day() : currentDay.isoWeekday(0).day();

        // Check out-of-range days
        const outOfRange = this._outOfRangeFunc();

        if (isNaN(firstDayOfWeek)) {
            throw 'firstDayOfWeek - NaN'; // Error that occurs sometimes - and  causes an eternal loop if not detected...
        }

        while (currentDay.day() !== firstDayOfWeek) { // Lazy approach, but simple
            currentDay.subtract(1, 'day');
        }

        const checkIfTheDayHasAnyData = () => datePresentedByDots.has(moment(currentDay).format('YYYY-M-D'));

        // fill an array with dates and properties
        const days = [];

        for (let index = 0; index < 42; index++) {
            const disabled = month !== currentDay.month();

            // Reached a new week that doesn't belong to the current month?
            if (disabled && index > 0 && currentDay.day() === firstDayOfWeek) {
                break; // Yes. Abort...
            }

            days.push({
                disabled,
                date:       (this.dateRangeSelectionCalendar || !disabled) ? currentDay.date() : '',
                range:      false,
                outOfRange: !disabled && outOfRange(currentDay),
                selected:   false,
                data:       !disabled && datePresentedByDots && checkIfTheDayHasAnyData()
            });

            currentDay.add(1, 'days');
        }

        // If the first week is empty, remove from they from array
        this._days = days[7].date === 1 ? days.slice(7) : days;

        if (this._focusedDay >= 0) {
            if (this._focusedDay >= this._days.length || this._days[this._focusedDay].disabled) {
                if (this._focusedDay - 7 >= 0 && !this._days[this._focusedDay - 7].disabled) {
                    this._focusedDay = this._focusedDay - 7;
                } else {
                    this._focusedDay = this._focusedDay + 7;
                }
            }
        }

        // Show current selection
        this._datesChanged(this.initialize, this.dateRangeSelectionCalendar, this._date1, this._date2);

        this.$.daysTemplate.render();
    }

    _datesChanged(initialize, dateRangeSelectionCalendar, _date1, _date2) {
        if (!initialize) {
            return;
        }

        // Clear all selections
        const clearAll = () => this._days.forEach((item, index) => {
            this.set(`_days.${index}.selected`, false);
            this.set(`_days.${index}.range`, false);
        });

        // Mark one day as selected (and clear all other days)
        const selectOne = day => this._days.forEach((item, index) => {
            if (item.disabled || item.date !== day) {
                this.set(`_days.${index}.selected`, false);
                this.set(`_days.${index}.range`, false);
            } else {
                this.set(`_days.${index}.selected`, true);
                this.set(`_days.${index}.range`, true);
            }
        });

        const eqMonth = (date1, date2) => date1 && date2 && date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
        const eqDay = (date1, date2) => eqMonth(date1, date2) && date1.getDate() === date2.getDate();

        // Mark selection range
        const selectRange = () => this._days.forEach((item, index) => {
            if (item.disabled) {
                this.set(`_days.${index}.selected`, false);
                this.set(`_days.${index}.range`, false);
            } else {
                const date = this._getSelectedDate$(index).toDate();
                this.set(`_days.${index}.selected`, _date1 <= date && date <= _date2);
                this.set(`_days.${index}.range`, eqDay(date, _date1) || eqDay(date, _date2));
            }
        });

        if (dateRangeSelectionCalendar) {
            if (_date1) {
                if (_date2) {
                    selectRange();
                } else if (eqMonth(_date1, this._getSelectedMonth$().toDate())) {
                    selectOne(_date1.getDate());
                }
            } else if (_date2 && eqMonth(_date2, this._getSelectedMonth$().toDate())) {
                selectOne(_date2.getDate());
            } else {
                clearAll();
            }
        } else if (_date1 && eqMonth(_date1, this._getSelectedMonth$().toDate())) {
            selectOne(_date1.getDate());
        } else {
            clearAll();
        }

        // Make sure the client is informed
        this.date1 = _date1;
        this.date2 = _date2;
    }

    _twelveHourClockChanged(twelveHourClock, old) {
        if (!twelveHourClock === !old) {
            return; // twelveHourClock did not really change
        }
        if (typeof this._selectedHour !== 'string' || typeof this._selectedMinute !== 'string') {
            return; // Calendar don't have a time yet, so there is nothing to adjust
        }
        if (this.dateRangeSelectionCalendar && !this.dateOnly && this._selectedHour2) {
            const time2$ = this._getDate$(this._selectedYear, this._selectedMonth, 1,
                this._selectedHour2, this._selectedMinute2, this._selectedSecond2, old && this._selectedMeridiem2);

            if (time2$.isValid()) {
                this._selectedHour2 = time2$.format(twelveHourClock ? 'hh' : 'HH');
            }
        }
        const time$ = this._getDate$(this._selectedYear, this._selectedMonth, 1,
            this._selectedHour, this._selectedMinute, this._selectedSecond, old && this._selectedMeridiem);

        this._computeHours(this.initialize);

        if (time$.isValid()) {
            this._selectedHour = time$.format(twelveHourClock ? 'hh' : 'HH');
        }
    }

    _changeTime(date, hour, minute, second, meridiem) {
        return this._getDate$(date.getFullYear(), this._months[date.getMonth()].name, date.getDate(),
            hour, minute, second, meridiem).toDate();
    }

    // Observe dropdown selections that update the date properties
    _timeChanged(initialize, _selectedHour, _selectedMinute, _selectedSecond, _selectedMeridiem) {
        if (this._settingTimeDropdowns) {
            return;
        }
        if (!initialize) {
            return;
        }
        if (this._date1) {
            this._date1 = this._changeTime(this._date1, _selectedHour, _selectedMinute, _selectedSecond,
                this.twelveHourClock && _selectedMeridiem);
        }
    }

    // Observe dropdown selections that update the date2 properties
    _time2Changed(initialize, _selectedHour2, _selectedMinute2, _selectedSecond2, _selectedMeridiem2) {
        if (this._settingTimeDropdowns) {
            return;
        }
        if (!initialize) {
            return;
        }
        if (this._date2) {
            this._date2 = this._changeTime(this._date2, _selectedHour2, _selectedMinute2, _selectedSecond2,
                this.twelveHourClock && _selectedMeridiem2);
        }
    }

    _nextMonthClick() {
        this.$.next.focus();
        this._nextMonth();
    }

    _nextMonth() {
        this._setCalendarMonth(this._getSelectedMonth$().add(1, 'month'));
    }

    _nextYear() {
        this._setCalendarMonth(this._getSelectedMonth$().add(1, 'year'));
    }

    _previousMonthClick() {
        this.$.prev.focus();
        this._previousMonth();
    }

    _previousMonth() {
        this._setCalendarMonth(this._getSelectedMonth$().subtract(1, 'month'));
    }

    _previousYear() {
        this._setCalendarMonth(this._getSelectedMonth$().subtract(1, 'year'));
    }

    _setCalendarMonth(date) {
        const m = moment(date);

        this.setProperties({
            _selectedYear:  String(m.year()),
            _selectedMonth: m.format('MMMM')
        });
    }

    _selectDayIndex(ixDay) {
        if (!(ixDay >= 0) || this._days[ixDay].disabled || this._days[ixDay].outOfRange) {
            return;
        }

        this._focusedDay = ixDay;
        const date$ = this._getSelectedDate$(ixDay);
        const date = date$.toDate();

        if (this.dateRangeSelectionCalendar) {
            const date1 = this.dateOnly ? date$.startOf('day').toDate() : date;
            const date2 = this.dateOnly ? date$.endOf('day').toDate() : date;
            const adjustTime = (d, h = 0, m = 0, s = 0, ms = 0) => {
                d.setHours(h);
                d.setMinutes(m);
                d.setSeconds(s);
                d.setMilliseconds(ms);
                return d;
            };

            // If clicked in start range area, select _date1
            // If clicked in end range area, select _date2
            // If no date is selected, select _date1
            // If one date is selected, then select the other - and make sure _date1 < _date2
            // If two dates are selected, then start new range from _date1
            // Adjust start / end times when start / end dates are flipped and this.dateOnly is true
            if (date <= asDate(this.maxStartDate)) {
                this._date1 = date1;
            } else if (date >= asDate(this.minEndDate)) {
                this._date2 = date2;
            } else if (this._date1) {
                if (this._date2) {
                    // Discard old range and start new range
                    this._date1 = date1;
                    this._date2Clear();
                } else if (this._date1 <= date) {
                    this._date2 = date2;
                } else {
                    [this._date1, this._date2] = [date1, this._date1];
                    if (this.dateOnly) {
                        [this._date1, this._date2] = [adjustTime(this._date1), adjustTime(this._date2, 23, 59, 59, 999)];
                    }
                }
            } else if (this._date2) {
                if (date <= this._date2) {
                    this._date1 = date1;
                } else {
                    [this._date1, this._date2] = [this._date2, date2];
                    if (this.dateOnly) {
                        [this._date1, this._date2] = [adjustTime(this._date1), adjustTime(this._date2, 23, 59, 59, 999)];
                    }
                }
            } else {
                // Start new range
                this._date1 = date1;
            }
            this.maxRangeUpdateDays();
        } else {
            // Range selections not enabled
            this._date1 = date;
        }
    }

    _selectDay(ev) {
        const el = ev.target.closest('[part=day]');
        if (el) {
            this._selectDayIndex(this.$.daysTemplate.indexForElement(el));
        }
    }

    _setDay(ev) {
        const el = ev.target.closest('[part=day]');
        if (!el || el.hasAttribute('disabled') || el.hasAttribute('out-of-range')) {
            return;
        }
        this._selectDay(ev);
        this._submit();
    }

    _submit() {
        if (!this._isFromAndToSelected(this.dateRangeSelectionCalendar, this._date1, this._date2)) {
            return; // Invalid call
        }

        this.dispatchEvent(new CustomEvent('calendar-date-changed', {detail: {date1: this._date1, date2: this._date2, closeCalendar: true}}));
    }

    _cancel() {
        this.dispatchEvent(new CustomEvent('calendar-date-changed', {
            bubbles:  true,
            composed: true,
            detail:   {
                closeCalendar:         true,
                dateSelectionCanceled: true
            }
        }));
    }

    _keyDown(ev) {
        if (this.disabled || ev.defaultPrevented) {
            return;
        }

        // Global keys
        switch (ev.key) {
            case 'Tab':
                if (ev.shiftKey && this.shadowRoot.activeElement === this.$.prev) {
                    this.shadowRoot.querySelector('[part=cancel-button]').focus();
                    ev.preventDefault();
                } else if (!ev.shiftKey && this.shadowRoot.activeElement === this.shadowRoot.querySelector('[part=cancel-button]')) {
                    this.$.prev.focus();
                    ev.preventDefault();
                }
                break;
            case 'Enter':
                if (this.dateRangeSelectionCalendar) {
                    this._submit();
                } else {
                    this._selectDayIndex(this._focusedDay);
                    this._submit();
                }
                ev.preventDefault();
                break;
            case 'Escape':
                this._cancel();
                ev.preventDefault();
        }

        if (this.shadowRoot.activeElement !== this.$.days) {
            return;
        }

        // Calendar days keys
        let fi = this._focusedDay;
        switch (ev.key) {
            case 'ArrowRight':
                fi++;
                if (fi >= this._days.length || this._days[fi].disabled) {
                    this._nextMonth();
                    fi = 0;
                    while (this._days[fi].disabled) {
                        fi++;
                    }
                }
                ev.preventDefault();
                break;
            case 'ArrowUp':
                fi -= 7;
                ev.preventDefault();
                break;
            case 'ArrowLeft':
                fi--;
                if (fi < 0 || (fi < 7 && this._days[fi].disabled)) {
                    this._previousMonth();
                    fi = this._days.length - 1;
                    while (this._days[fi].disabled) {
                        fi--;
                    }
                }
                ev.preventDefault();
                break;
            case 'ArrowDown':
                fi += 7;
                ev.preventDefault();
                break;
            case 'PageUp':
                if (ev.shiftKey) {
                    this._previousYear();
                } else {
                    this._previousMonth();
                }
                ev.preventDefault();
                break;
            case 'Home':
                // Start of week
                fi = Math.max(0, fi - (fi % 7));
                ev.preventDefault();
                break;
            case 'PageDown':
                if (ev.shiftKey) {
                    this._nextYear();
                } else {
                    this._nextMonth();
                }
                ev.preventDefault();
                break;
            case 'End':
                // End of week
                fi = Math.min(this._days.length, fi - (fi % 7) + 6);
                ev.preventDefault();
                break;
            case ' ':
                this._selectDayIndex(fi);
                ev.preventDefault();
                break;
        }

        // Check and fix limit errors
        if (fi < 0 || (fi < 7 && this._days[fi].disabled)) {
            fi = fi + 7;
        } else if (fi >= this._days.length || this._days[fi].disabled) {
            fi = fi - 7;
        }

        // Update focus
        if (fi !== this._focusedDay) {
            this._focusedDay = fi;
        }
    }

    _isFromAndToSelected(dateRangeSelectionCalendar, date1, date2) {
        return !dateRangeSelectionCalendar || (date1 || date2);
    }

    _getel(id) {
        const el = this.$[id];
        return el || (this.$[id] = this.shadowRoot.getElementById(id)) || {};
    }

    get _currhour2() {
        return this._getel('currhour2');
    }

    get _currminute2() {
        return this._getel('currminute2');
    }

    get _currsecond2() {
        return this._getel('currsecond2');
    }

    get _meridiem2() {
        return this._getel('meridiem2');
    }

    // Clear _date2 and reset End time dropdowns (e.g. user initiated new range selection in calendar, or cleared end date
    // from datepicker controls before opening calendar)
    _date2Clear() {
        this._date2 = undefined;
        if (!this.dateOnly) {
            // Clear comboboxes for _date2
            this._currhour2.text = '';
            this._currminute2.text = '';
            this._currsecond2.text = '';
            this._meridiem2.text = '';
        }
    }

    _datetimerangepicker(dateRangeSelectionCalendar, dateOnly) {
        return dateRangeSelectionCalendar && !dateOnly;
    }

    _calendarStartTimeLabelHidden(dateRangeSelectionCalendar, dateOnly, calendarStartTimeLabel) {
        return !calendarStartTimeLabel || !this._datetimerangepicker(dateRangeSelectionCalendar, dateOnly);
    }
};

customElements.define(PTCS.DatepickerCalendar.is, PTCS.DatepickerCalendar);
