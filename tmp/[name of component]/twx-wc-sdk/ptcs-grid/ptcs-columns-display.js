import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import '@polymer/polymer/lib/elements/dom-repeat.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-icon/ptcs-icon.js';
import 'ptcs-icons/cds-icons.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-checkbox/ptcs-checkbox.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';
import {delegateToPrev} from 'ptcs-behavior-focus/ptcs-behavior-focus.js';

// Dragging mode for reorder column element
const startDragging = column => column.classList.add('dragging');
const stopDragging = column => column.classList.remove('dragging');
const isDragging = column => column.classList.contains('dragging');


PTCS.ColumnsDisplay = class extends PTCS.BehaviorTooltip(PTCS.BehaviorFocus(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)))) {
    static get template() {
        return html`
            <style>
                :host([mode=closed]) {
                    display: none;
                }

                .column-defs {
                    outline: none;
                    overflow: auto;
                }

                .column-def {
                    width: 100%;
                    box-sizing: border-box;

                    display: flex;
                    flex-direction: row;
                    align-items: stretch;
                }

                .draggable {
                    display: none;
                    position: absolute;
                }

                .draggable.dragging {
                    display: flex;
                    cursor: grabbing;
                }

                ptcs-button {
                    width: 100%;
                }

                [hidden] {
                    display: none;
                }

                .label-row {
                    flex: 1 1 auto;
                    flex-direction: row;
                }
            </style>

            <div class="column-defs" id="columns" tabindex\$="[[_delegatedFocus]]">
                <dom-repeat items="[[_columns]]">
                    <template>
                        <div class="column-def" part="column-def">
                            <ptcs-icon part="col-icon" hidden$="[[_isIconHidden(options)]]" icon="cds:icon_drag_handle_mini"></ptcs-icon>
                                <ptcs-checkbox no-tabindex part="col-checkbox" hidden$="[[_isCheckboxHidden(options)]]"
                                    label="[[_getCheckboxLabel(options, item.label)]]" class="label-row"
                                    checked="[[_isColumnVisible(item.hidden)]]" on-checked-changed="_checkedChanged">
                                </ptcs-checkbox>
                                <ptcs-label part="col-label" hidden$="[[_isLabelHidden(options)]]" label="[[item.label]]"
                                            variant="label" class="label-row" vertical-alignment="center"></ptcs-label>
                        </div>
                    </template>
                </dom-repeat>
                <div id="draggable" class="column-def draggable" part="column-def">
                    <ptcs-icon part="col-icon" hidden$="[[_isIconHidden(options)]]" icon="cds:icon_drag_handle_mini"></ptcs-icon>
                    <ptcs-checkbox no-tabindex id="draggable-checkbox" part="col-checkbox" hidden$="[[_isCheckboxHidden(options)]]"
                        class="label-row"></ptcs-checkbox>
                    <ptcs-label id="draggable-label" part="col-label" hidden$="[[_isLabelHidden(options)]]" variant="label"
                        class="label-row" vertical-alignment="center"></ptcs-label>
                </div>
            </div>
            <div id="actions" part="actions">
                <ptcs-button id="apply" part="apply" variant="primary" label="[[applyButtonText]]"
                             on-action="_apply" tabindex\$="[[_delegatedFocus]]"></ptcs-button>
                <ptcs-button id="cancel" part="cancel" variant="tertiary" label="[[cancelButtonText]]"
                             on-action="_cancel" tabindex\$="[[_delegatedFocus]]"></ptcs-button>
            </div>
            `;
    }

    static get is() {
        return 'ptcs-columns-display';
    }

    static get properties() {
        return {
            view: {
                type: Object
            },

            options: {
                type:               String,
                value:              'both',
                reflectToAttribute: true
            },

            visibleItems: {
                type:  Number,
                value: 6
            },

            mode: {
                type:               String,
                value:              'closed',
                reflectToAttribute: true,
                observer:           '_modeChanged',
                notify:             true
            },

            // Focused column
            _focusedColumnIx: {
                type:  Number,
                value: 0
            },

            // Focused Item (0 = drag icon, 1 = checkbox)
            _focusedItemIx: {
                type:  Number,
                value: 0
            },

            _colH: {
                value: 34
            },

            _delegatedFocus: {
                type:  String,
                value: null
            },

            // Tooltip for the reorder icon
            tooltipReorder: {
                type: String
            },

            // Tooltip for the show checkbox
            tooltipShow: {
                type: String
            },

            // 'Apply' button label
            applyButtonText: {
                type: String
            },

            // 'Cancel' button label
            cancelButtonText: {
                type: String
            },

            // Are we dragging the column display item up or down?
            _up: {
                type:               Boolean,
                reflectToAttribute: true
            }
        };
    }

    static get observers() {
        return ['_setTooltipByFocus(_focusedItemIx, _focusedColumnIx)'];
    }

    ready() {
        super.ready();

        this.addEventListener('keydown', this._keyDown.bind(this));

        this._trackFocus(this.$.columns, this._focusedElement.bind(this));

        this.$.columns.addEventListener('touchstart', ev => this._mouseDownColumnDef(ev, true));
        this.$.columns.addEventListener('mousedown', ev => this._mouseDownColumnDef(ev));
        this.$.columns.addEventListener('mousemove', ev => this._mouseMoveColumnDef(ev));
        this.$.columns.addEventListener('mouseout', ev => this._mouseOutColumnDef(ev));

        if (!this.applyButtonText) {
            this.applyButtonText = 'Apply';
        }
        if (!this.cancelButtonText) {
            this.cancelButtonText = 'Cancel';
        }
    }

    _focusedElement() {
        if (this._focusedColumnIx < 0 || !Array.isArray(this._columns) || this._focusedColumnIx > this._columns.length - 1) {
            return null; // No focus
        }
        if (this.options === 'both') {
            return this.$.columns.children[this._focusedColumnIx].querySelector(this._focusedItemIx === 0 ? 'ptcs-icon' : '.label-row');
        }
        return this.$.columns.children[this._focusedColumnIx];
    }

    _apply() {
        if (this.view) {
            // Update the real grid view
            this.view.columnsDef = [...this._columns];

            this._columnsBU = [];
        }

        this.mode = 'closed';
        delegateToPrev(this);
    }

    _cancel() {
        this.mode = 'closed';
        delegateToPrev(this);
    }

    // If only one columns remains visible then its show/hide checkbox should be disabled
    _checkDisabled() {
        let visibleColumnIndex = -1;
        const visibleColumns = this._columns.filter((col, i) => {
            if (!col.hidden) {
                visibleColumnIndex = i;
                return true;
            }

            return false;
        });

        this.$.columns.querySelectorAll('[part="col-checkbox"]').forEach((el, i) => {
            el.disabled = (visibleColumns.length === 1 && i === visibleColumnIndex);
        });
    }

    _modeChanged(mode) {
        if (mode === 'open') {
            this.style.visibility = 'hidden';

            // Sometimes checkboxes are not refreshed. I have no idea why. So using the next line...
            this._columns = [];

            requestAnimationFrame(() => {
                this._columns = [...this.view._columnsDef];

                this._checkDisabled();

                // Store the default values of some attributes
                this._columnsBU = this._columns.map(e => ({hidden: !!e.hidden}));

                // Make sure the focused item shows a tooltip
                this._closeTooltip();
                this._focusedColumnIx = -1;

                requestAnimationFrame(() => {
                    if (this.visibleItems && !isNaN(this.visibleItems) && this.visibleItems < this._columns.length) {
                    // Get the height of one column item
                        this._colH = this.$.columns.children[0].getBoundingClientRect().height;
                        this.$.columns.style.height = `${this._colH * this.visibleItems}px`;
                    } else {
                        this.$.columns.style.height = '';
                    }

                    this.$.columns.scrollTop = 0;

                    // Focus on the first column
                    this._focusedColumnIx = this._focusedItemIx = 0;

                    this.style.visibility = '';
                });
            });
        } else {
            this._cleanDraggingStates();

            // Restore the default values. If "Apply" was clicked the default values will be already updated.
            if (this.view) {
                // Undo the reorder changes
                this._columns = [...this.view._columnsDef];

                // Restore the attributes from the backup
                this._columnsBU.forEach((col, i) => {
                    this.set(`_columns.${i}.hidden`, !!col.hidden);
                });
            }
        }
    }

    _cleanDraggingStates() {
        this.$.columns.querySelectorAll('.dragging').forEach((el) => {
            stopDragging(el);
        });
    }

    _isColumnVisible(hidden) {
        return !hidden;
    }

    _isLabelHidden(options) {
        return options !== 'reorder';
    }

    _isCheckboxHidden(options) {
        return !this._isLabelHidden(options);
    }

    _isIconHidden(options) {
        return options === 'show';
    }

    _getCheckboxLabel(options, label) {
        return this._isLabelHidden(options) ? label : '';
    }

    _checkedChanged(ev) {
        this.set(`_columns.${ev.model.index}.hidden`, !ev.target.checked);

        this._checkDisabled();
    }

    _showTooltip(ev, delay = undefined) {
        const tooltipEl = (!this._isIconHidden(this.options) && ev.target.closest('ptcs-icon')) ||
                          (!this._isCheckboxHidden(this.options)) && ev.target.closest('ptcs-checkbox');
        if (tooltipEl === this.__tooltipEl) {
            return;
        }

        const tooltip = tooltipEl && (tooltipEl.tagName === 'PTCS-ICON' ? this.tooltipReorder : this.tooltipShow);
        if (tooltip) {
            this.__tooltipEl = tooltipEl;
            this._tooltipEnter(this.__tooltipEl, ev.clientX, ev.clientY, tooltip, {showAnyway: true, delay});
        } else {
            this._closeTooltip();
        }
    }

    _closeTooltip() {
        if (this.__tooltipEl) {
            this._tooltipLeave(this.__tooltipEl);
            this.__tooltipEl = null;
        }
    }

    _setTooltipByFocus(_focusedItemIx /*, _focusedColumnIx*/) {
        const target = this._focusedElement();
        this._closeTooltip();
        if (target) {
            this._showTooltip({target}, 25);
        }
    }

    _moveColumn(curr, ix) {
        if (curr === ix) {
            return;
        }

        let tmp = this._columns[curr];
        this.splice('_columns', curr, 1);
        this.splice('_columns', ix, 0, tmp);

        tmp = this._columnsBU[curr];
        this._columnsBU.splice(curr, 1);
        this._columnsBU.splice(ix, 0, tmp);

        this._checkDisabled();
    }

    _mouseMoveColumnDef(ev) {
        this._showTooltip(ev);

        if (this.options === 'show') {
            return;
        }

        const cell = ev.target.closest('.column-def');

        if (!cell) {
            return;
        }

        if ((ev.target.tagName === 'PTCS-ICON' && this.options === 'both') || (this.options === 'reorder')) {
            cell.setAttribute('hovered', '');
            cell.style.cursor = 'grab';
        } else {
            cell.removeAttribute('hovered');
            cell.style.cursor = '';
        }
    }

    _mouseOutColumnDef(ev) {
        const cell = ev.target.closest('.column-def');

        if (!cell) {
            return;
        }

        cell.removeAttribute('hovered');
    }

    // Reorder columns
    _mouseDownColumnDef(ev, touch = false) {
        if (PTCS.wrongMouseButton(ev)) {
            return;
        }
        const y0 = PTCS.getCoordinatesFromEvent(ev).posY;
        let dMin, dMax, yMin, yMax;
        let a;
        let curr;

        // Click on icon or on checkbox / label?
        this._focusedItemIx = ev.target.tagName === 'PTCS-ICON' ? 0 : 1;

        if ((ev.target.tagName !== 'PTCS-ICON' && this.options === 'both') ||
            this.options === 'show') {
            // Set focus on clicked element
            const row = ev.target.closest('.column-def');
            if (row) {
                this._focusedColumnIx = PTCS.getChildIndex(row);
            }
            return;
        }

        const mouseMoveEv = touch ? 'touchmove' : 'mousemove';
        const mouseUpEv = touch ? 'touchend' : 'mouseup';

        this._cleanDraggingStates();

        // Loose columns focus on mouse down
        this._focusedColumnIx = -1;

        const cell = ev.target.closest('.column-def');
        const all = cell.closest('.column-defs').querySelectorAll('.column-def:not(.draggable)');

        // Fill the dimensions of the column cells in an array
        const fillA = () => {
            a = [];

            for (let i = 0; i < all.length; i++) {
                const el = all[i];
                const bb = all[i].getBoundingClientRect();

                a.push({el, top: bb.top, bottom: bb.bottom});

                if (el === cell) {
                    curr = i;
                }
            }
        };

        const find = (y) => {
            const ix = a.findIndex((item) => item.top - (this._colH / 2) <= y && y < item.bottom + (this._colH / 2));
            // eslint-disable-next-line no-nested-ternary
            return ix >= 0 ? ix : (y < a[0].top ? 0 : a.length - 1);
        };

        const mouseMoveColumnDef = (ev2) => {
            const posY = PTCS.getCoordinatesFromEvent(ev2).posY;

            // Drag direction: up or down?
            this._up = (y0 - posY) > 0;

            // Delta how much you are far from the first mousedown
            const d = Math.min(Math.max(dMin, posY - y0), dMax);

            this.$.draggable.style.transform = `translateY(${d}px)`;

            let dR = this.$.draggable.getBoundingClientRect();

            // Check if we need to scroll to the new location
            if (dR.bottom >= yMax) {
                this.$.columns.scrollTop += (posY - dR.top) / 2;
                fillA();
            } else if (dR.top <= yMin) {
                this.$.columns.scrollTop -= (dR.bottom - posY) / 2;
                fillA();
            }

            const ix = find(dR.bottom);

            a.forEach((item, i) => {
                if (i === ix) {
                    item.el.classList.add('droppable');
                } else {
                    item.el.classList.remove('droppable');
                }
            });

            ev2.preventDefault();

            // Stop the event here. Otherwise you will e.g. see grid resizers.
            ev2.stopPropagation();
        };

        const mouseUpColumnDef = () => {
            window.removeEventListener(mouseMoveEv, mouseMoveColumnDef, true);
            let dR = this.$.draggable.getBoundingClientRect();

            const ix = find(dR.bottom);

            a.forEach(item => {
                item.el.style.transform = '';
                item.el.classList.remove('droppable');
            });

            if (ix !== curr) {
                this._moveColumn(curr, ix);
            }

            stopDragging(this.$.draggable);
            this.$.draggable.style.transform = '';

            this._focusedColumnIx = ix;
        };

        fillA();

        const cR = this.$.columns.getBoundingClientRect();
        yMin = cR.top;
        yMax = cR.bottom;
        dMax = cR.bottom - a[curr].bottom;
        dMin = cR.top - a[curr].top;

        startDragging(this.$.draggable);
        this.$.draggable.style.top = `${a[curr].top - yMin}px`;
        this.$['draggable-label'].label = this._columns[curr].label;
        this.$['draggable-checkbox'].checked = !this._columns[curr].hidden;
        this.$['draggable-checkbox'].label = this._columns[curr].label;

        // Track mouse or touch
        window.addEventListener(mouseMoveEv, mouseMoveColumnDef, true);
        window.addEventListener(mouseUpEv, mouseUpColumnDef, {once: true});
        // }

        ev.preventDefault();
    }

    _activateRow(rowIndex, key) {
        const column = this.$.columns.children[rowIndex];
        if (!column) {
            return;
        }


        // Only activate row item on Space key
        if (key !== ' ') {
            return;
        }

        // Activate row item with focus
        const toggleDragging = () => {
            column.classList.toggle('dragging');
        };
        const toggleShowColumn = () => {
            const checkbox = column.querySelector('ptcs-checkbox');
            if (checkbox) {
                checkbox.click();
            }
        };
        switch (this.options) {
            case 'both':
                if (this._focusedItemIx === 0) {
                    toggleDragging();
                } else {
                    toggleShowColumn();
                }
                break;
            case 'show':
                toggleShowColumn();
                break;
            case 'reorder':
                toggleDragging();
        }
    }

    _keyDown(ev) {
        let ci = this._focusedColumnIx;
        const cl = this._columns.length - 1;
        const columns = this.$.columns.children;

        switch (ev.key) {
            case 'ArrowLeft':
                if (this.options !== 'both') {
                    return;
                }
                this._focusedItemIx = 0;
                break;
            case 'ArrowRight':
                if (this.options !== 'both') {
                    return;
                }
                stopDragging(columns[ci]);
                this._focusedItemIx = 1;
                break;
            case 'ArrowUp':
                if (isDragging(columns[ci]) && ci > 0) {
                    this._moveColumn(ci, ci - 1);
                    stopDragging(columns[ci]);
                    startDragging(columns[ci - 1]);
                }
                ci = Math.max(ci - 1, 0);
                break;
            case 'ArrowDown':
                if (isDragging(columns[ci]) && ci < cl) {
                    this._moveColumn(ci, ci + 1);
                    stopDragging(columns[ci]);
                    startDragging(columns[ci + 1]);
                }
                ci = Math.min(ci + 1, cl);
                break;
            case 'Tab':
                // In "edge" cases closes the dialog and return to the "Display" button
                if ((!ev.shiftKey && this.shadowRoot.activeElement === this.$.cancel) ||
                    (ev.shiftKey && this.shadowRoot.activeElement === this.$.columns)) {
                    ev.preventDefault();
                    delegateToPrev(this);
                    this.mode = 'closed';
                }
                return;
            case 'Enter':
                // New behavior---an 'Enter' press in the dialog should simulate a click on the Apply
                // button, you should no longer have to TAB to it...
                this._apply();
                break;
            case ' ':
                if (this.shadowRoot.activeElement !== this.$.columns) {
                    return;
                }
                this._activateRow(ci, ev.key);
                break;
            case 'Escape':
                this._cancel();
                break;
            default:
                // Not handled
                return;
        }

        // Keyboard event has been consumed
        ev.preventDefault();

        if (this._focusedColumnIx === ci) {
            return; // Focus has not changed
        }

        this._focusedColumnIx = ci;

        const cR = this.$.columns.getBoundingClientRect();
        const colR = columns[ci].getBoundingClientRect();

        if (colR.top < cR.top) {
            // We're outside the columns boundaries
            // this.$.columns.scrollTop = (colR.top - col0.top);
            this.$.columns.scrollTop -= this._colH;
        } else if (colR.bottom > cR.bottom) {
            this.$.columns.scrollTop += this._colH;
        }
    }
};

customElements.define(PTCS.ColumnsDisplay.is, PTCS.ColumnsDisplay);
