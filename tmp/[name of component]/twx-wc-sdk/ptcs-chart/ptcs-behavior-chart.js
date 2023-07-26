/* eslint-disable no-confusing-arrow */
import './ptcs-chart-icons.js';
import {typeValue, invTypeValue} from 'ptcs-library/library-chart.js';

export const BehaviorChart = superClass => class extends superClass {
    static get properties() {
        return {
            // Controlled by this behavior: are any tools visible in toolbar?
            _hideToolbar: {
                type: Boolean
            },

            // Show / Hide Legend toolbar button
            showLegendButton: {
                type: Boolean
            },

            // Label for 'Select All' link
            selectAllLabel: {
                type:  String,
                value: 'Select All'
            },

            // Label for 'clear All' link
            unselectAllLabel: {
                type:  String,
                value: 'Clear All'
            },

            // Label for 'Zoom in' button
            zoomInLabel: {
                type:  String,
                value: 'Zoom in'
            },

            // Label for 'Zoom out' button
            zoomOutLabel: {
                type:  String,
                value: 'Zoom Out'
            },

            // Label for Show Legend button
            showLegendLabel: {
                type:  String,
                value: 'Show Legend'
            },

            // Label for Hide Legend button
            hideLegendLabel: {
                type:  String,
                value: 'Hide Legend'
            },

            showHideLegendButtonType: {
                type:  String,
                value: 'transparent'
            },

            // Label for zoom reset button
            resetLabel: {
                type:  String,
                value: 'Reset'
            },

            resetButtonType: {
                type:  String,
                value: 'transparent'
            },

            // Show zoom buttons
            showZoomButtons: {
                type: Boolean
            },

            axisDisplayButton: {
                type:  String,
                value: 'Axis Display'
            },

            _showAxisDisplayButton: {
                type: Boolean
            },

            // Show reset button
            _isZoomable$tb: {
                type: Boolean
            },

            // Assign to true to enable zoom reset (and zoom out) buttons
            _resetButtonEnabled$tb: {
                type: Boolean
            }
        };
    }

    static get _leftActions() {
        return [
            // Select All / Unselect All
            {
                type:   'link',
                id:     'select-all',
                label:  '_if(_chartSelection.length, unselectAllLabel, selectAllLabel)',
                hidden: '_hideSelectAll(selectionMode, xZoomSelect, yZoomSelect)'
            }
        ];
    }

    static get _rightActions() {
        return [
            {
                type: 'button',
                id:   'zoom-in',
                alt:  'zoomInLabel',
                opt:  {
                    icon:    'chart-icons:zoom-in',
                    variant: 'transparent'
                },
                hidden:   '!showZoomButtons',
                disabled: '_disableZoomIn(xZoomStart, xZoomEnd, _xMin, _xMax, _xType, yZoomStart, yZoomEnd, _yMin, _yMax, _yType)'
            },
            {
                type: 'button',
                id:   'zoom-out',
                alt:  'zoomOutLabel',
                opt:  {
                    icon:    'chart-icons:zoom-out',
                    variant: 'transparent'
                },
                hidden:   '!showZoomButtons',
                disabled: '!_resetButtonEnabled$tb'
            },
            {
                type:  'button',
                id:    'axis-display-button',
                label: 'axisDisplayButton',
                opt:   {
                    variant:       'transparent',
                    icon:          'cds:icon_chevron_down',
                    iconPlacement: 'right'
                },
                hidden: '!_showAxisDisplayButton'
            },
            {
                type:  'button',
                id:    'show-legend',
                label: '_if(hideLegend, showLegendLabel, hideLegendLabel)',
                opt:   {
                    icon:    'cds:icon_list',
                    variant: 'showHideLegendButtonType'
                },
                hidden: '!showLegendButton'
            },
            {
                type:  'button',
                id:    'reset',
                label: 'resetLabel',
                alt:   'resetLabel',
                opt:   {
                    icon:    'cds:icon_refresh',
                    variant: 'resetButtonType'
                },
                hidden:   '!_isZoomable$tb',
                disabled: '!_resetButtonEnabled$tb',
            }
        ];
    }

    constructor() {
        super();
        this._toolbarVisibleSet = new Set();
    }

    ready() {
        super.ready();
        this._hideToolbar = true;
        requestAnimationFrame(this._initToolbar.bind(this));
    }

    _if(a, b, c) {
        return a ? b : c;
    }

    _or(...args) {
        return args.some(v => !!v);
    }

    _and(...args) {
        return args.every(v => !!v);
    }

    _alias(value) {
        return value;
    }

    _getStatic(name) {
        for (let el = this; el; el = Object.getPrototypeOf(el)) {
            if (el.constructor[name]) {
                return el.constructor[name];
            }
        }
        return null;
    }

    _setToolbarItemHidden(id, hidden) {
        if (hidden) {
            this._toolbarVisibleSet.delete(id);
        } else {
            this._toolbarVisibleSet.add(id);
        }

        this._hideToolbar = this._toolbarVisibleSet.size === 0;

        this.$.toolbar.setHidden(id, hidden);
    }

    _initToolbar() {
        const toolbar = this.$.toolbar;
        if (!toolbar) {
            return;
        }

        // Does name have any meaning in this?
        const is = name => {
            if (typeof this[name] !== 'undefined') {
                return true;
            }
            for (let el = this; el; el = Object.getPrototypeOf(el)) {
                const properties = el.constructor.properties;
                if (properties && properties[name] !== undefined) {
                    return true;
                }
            }
            return false;
        };

        // Resolve value of key
        const get = key => key.split('.').reduce((_obj, f) => _obj && _obj[f.trim()], this);

        let moix = 0;

        const _mapField = (r, field, item, cb) => {
            const value = item[field];
            if (typeof value !== 'string') {
                r[field] = value;
                return;
            }

            const m = /^(!)?([_$a-zA-Z0-9]+)(\(.*\))?$/.exec(value);
            if (!m) {
                r[field] = value;
                return;
            }

            const neg = m[1];
            const name = m[2];
            const args = m[3];

            if (!is(name)) {
                r[field] = value;
                return;
            }

            if (args) {
                if (cb) {
                    const fName = `__$cb${moix++}`;
                    this[fName] = function(...arg) {
                        const v = this[name](...arg);
                        cb(neg ? !v : v);
                    };
                    this._createMethodObserver(`${fName}${args}`, false);
                }
                const v = this[name](...args.substring(1, args.length - 1).split(',').map(get));
                r[field] = neg ? !v : v;
            } else {
                r[field] = neg ? !this[name] : this[name];
                if (cb) {
                    this._createPropertyObserver(name, neg ? v => cb(!v) : cb, false);
                }
            }
        };

        const _mapToolbarItem = item => {
            const id = item.id;
            const opt = item.opt ? {} : undefined;
            const r = {type: item.type, id, opt};

            _mapField(r, 'label', item, label => this.$.toolbar.setLabel(id, label));
            _mapField(r, 'alt', item, alt => this.$.toolbar.setTooltip(id, alt));
            _mapField(r, 'hidden', item, hidden => this._setToolbarItemHidden(id, hidden));
            _mapField(r, 'disabled', item, disabled => this.$.toolbar.setDisabled(id, disabled));
            if (opt) {
                _mapField(opt, 'icon', item.opt);
                _mapField(opt, 'variant', item.opt);
                _mapField(opt, 'iconPlacement', item.opt);
            }

            return r;
        };

        toolbar.actions = this._getStatic('_leftActions').map(_mapToolbarItem);
        toolbar.rightActions = this._getStatic('_rightActions').map(_mapToolbarItem);

        // Keep track of visible items
        [...toolbar.actions, ...toolbar.rightActions].forEach(item => {
            if (!item.hidden) {
                this._toolbarVisibleSet.add(item.id);
            }
        });

        this._hideToolbar = this._toolbarVisibleSet.size === 0;

        // Hack
        toolbar.setArrowDownActivate('axis-display-button', true);
    }

    _toolbarAction(ev) {
        switch (ev.detail.action.id) {
            case 'select-all':
                if (ev.detail.action.label === this.selectAllLabel) {
                    this.selectAll();
                } else {
                    this.unselectAll();
                }

                break;

            case 'show-legend':
                this.toggleLegend();
                break;

            case 'reset':
                this.zoom();
                break;

            case 'zoom-in':
                this.zoom(1.4);
                break;

            case 'zoom-out':
                this.zoom(1 / 1.4);
                break;

            case 'axis-display-button':
                if (typeof this._showAxisDisplay === 'function') {
                    this._showAxisDisplay(ev.detail.r);
                }
                break;

            default:
                console.log('toolbar action: ' + ev.detail.action.id);
        }
    }

    _disableZoomIn(xZoomStart, xZoomEnd, _xMin, _xMax, _xType, yZoomStart, yZoomEnd, _yMin, _yMax, _yType) {
        const canZoom = (z1, z2, min, max, type) => {
            const z1$ = typeValue(z1 || min, type);
            const z2$ = typeValue(z2 || max, type);
            const min$ = typeValue(min, type);
            const max$ = typeValue(max, type);
            return ((z2$ - z1$) / (max$ - min$)) > 0.01;
        };
        return !(canZoom(xZoomStart, xZoomEnd, _xMin, _xMax, this._xType) || canZoom(yZoomStart, yZoomEnd, _yMin, _yMax, this._yType));
    }

    zoom(zoomFactor) {
        if (zoomFactor === undefined) {
            // Reset zoom
            this.yZoomStart = undefined;
            this.yZoomEnd = undefined;
            this.xZoomStart = undefined;
            this.xZoomEnd = undefined;
            return;
        }
        // Apply zoom factor
        const z = (z1, z2, min, max, type) => {
            const z1$ = typeValue(z1 || min, type);
            const z2$ = typeValue(z2 || max, type);
            const min$ = typeValue(min, type);
            const max$ = typeValue(max, type);
            const m = (z1$ + z2$) / 2;
            const d = Math.max(1, (z2$ - z1$) / (2 * zoomFactor));
            const c = v => min$ < v && v < max$ ? invTypeValue(zoomFactor > 1 ? Math.max(z1$, Math.min(z2$, v)) : v, type) : undefined;
            const _z1 = c(m - d);
            const _z2 = c(m + d);

            // If zooming with no change, force step
            return zoomFactor < 1
                ? [_z1 === z1 ? undefined : _z1, _z2 === z2 ? undefined : _z2]
                : [_z1 === z1 ? invTypeValue(m, type) : _z1, _z2 === z2 ? invTypeValue(m, type) : _z2];
        };
        if (typeof zoomFactor === 'number') {
            [this.xZoomStart, this.xZoomEnd] = z(this.xZoomStart, this.xZoomEnd, this._xMin, this._xMax, this._xType);
            [this.yZoomStart, this.yZoomEnd] = z(this.yZoomStart, this.yZoomEnd, this._yMin, this._yMax, this._yType);
        }
    }

    _hideSelectAll(selectionMode, xZoomSelect, yZoomSelect) {
        if (xZoomSelect || yZoomSelect) {
            return true;
        }
        return selectionMode !== 'multiple';
    }

    selectAll() {
        this.$.chart.selectAll();
    }

    unselectAll() {
        this.$.chart.unselectAll();
    }

    toggleLegend() {
        this.hideLegend = !this.hideLegend;
    }
};
