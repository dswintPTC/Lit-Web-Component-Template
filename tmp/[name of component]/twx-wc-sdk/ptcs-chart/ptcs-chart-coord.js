import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-binary/ptcs-behavior-binary.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import {select} from 'd3-selection';

PTCS.ChartCoord = class extends PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)) {
    static get template() {
        return html`
    <style>
    :host {
        width: 100%;
        height: 100%;
        overflow: hidden;
        display: grid;
        grid-template-columns: auto 1fr auto;
        grid-template-rows: auto 1fr auto;
    }

    [part=chart-slot] {
        grid-column: 2;
        grid-row: 2;
    }

    [part=rulers] {
        grid-column: 2;
        grid-row: 2;
        position: relative;
        pointer-events: none;
    }

    /* X-axis */
    :host(:not([flip-axes]):not([flip-x-axis])) [part=xaxis-slot] {
        grid-column: 2;
        grid-row: 3;
    }

    :host(:not([flip-axes])[flip-x-axis]) [part=xaxis-slot] {
        grid-column: 2;
        grid-row: 1;
    }

    :host([flip-axes]:not([flip-x-axis])) [part=xaxis-slot] {
        grid-column: 1;
        grid-row: 2;
    }

    :host([flip-axes][flip-x-axis]) [part=xaxis-slot] {
        grid-column: 3;
        grid-row: 2;
    }

    /* X-axis2 */
    :host(:not([flip-axes]):not([flip-x-axis])) [part=xaxis2-slot] {
        grid-column: 2;
        grid-row: 1;
    }

    :host(:not([flip-axes])[flip-x-axis]) [part=xaxis2-slot] {
        grid-column: 2;
        grid-row: 3;
    }

    :host([flip-axes]:not([flip-x-axis])) [part=xaxis2-slot] {
        grid-column: 3;
        grid-row: 2;
    }

    :host([flip-axes][flip-x-axis]) [part=xaxis2-slot] {
        grid-column: 1;
        grid-row: 2;
    }

    /* Y-axis */
    :host(:not([flip-axes]):not([flip-y-axis])) [part=yaxis-slot] {
        grid-column: 1;
        grid-row: 2;
    }

    :host(:not([flip-axes])[flip-y-axis]) [part=yaxis-slot] {
        grid-column: 3;
        grid-row: 2;
    }

    :host([flip-axes]:not([flip-y-axis])) [part=yaxis-slot] {
        grid-column: 2;
        grid-row: 3;
    }

    :host([flip-axes][flip-y-axis]) [part=yaxis-slot] {
        grid-column: 2;
        grid-row: 1;
    }

    /* Y-axis2 */
    :host(:not([flip-axes]):not([flip-y-axis])) [part=yaxis2-slot] {
        grid-column: 3;
        grid-row: 2;
    }

    :host(:not([flip-axes])[flip-y-axis]) [part=yaxis2-slot] {
        grid-column: 1;
        grid-row: 2;
    }

    :host([flip-axes]:not([flip-y-axis])) [part=yaxis2-slot] {
        grid-column: 2;
        grid-row: 1;
    }

    :host([flip-axes][flip-y-axis]) [part=yaxis2-slot] {
        grid-column: 2;
        grid-row: 3;
    }

    /* Y-rulers */
    :host(:not([show-y-rulers])) #yrulers {
        display: none;
    }

    :host(:not([show-y2-rulers])) #y2rulers {
        display: none;
    }

    [part~=y-ruler] {
        position: absolute;
    }

    :host(:not([flip-axes])) [part~=y-ruler] {
        left: -4px;
        right: 0;
        top: 0;
        height: 1px;
    }

    :host(:not([flip-axes])[flip-y-axis]) [part~=y-ruler] {
        left: 0;
        right: -4px;
    }

    :host([flip-axes]) [part~=y-ruler] {
        top: 0;
        bottom: -4px;
        left: 0;
        width: 1px;
    }

    :host([flip-axes][flip-y-axis]) [part~=y-ruler] {
        top: -4px;
        bottom: 0;
    }

    :host(:not([show-x-rulers])) #xrulers {
        display: none;
    }

    /* X-ruler */
    [part~=x-ruler] {
        position: absolute;
    }

    :host(:not([flip-axes])) [part~=x-ruler] {
        top: 0;
        bottom: -4px;
        left: 0;
        width: 1px;
    }

    :host(:not([flip-axes])[flip-x-axis]) [part~=x-ruler] {
        top: -4px;
        bottom: 0;
    }

    :host([flip-axes]) [part~=x-ruler] {
        left: -4px;
        right: 0;
        top: 0;
        height: 1px;
    }

    :host([flip-axes][flip-y-axis]) [part~=x-ruler] {
        left: 0;
        right: -4px;
    }

    /* Zero-ruler */
    :host([hide-zero-ruler]) [part~=zero-ruler] {
        display: none;
    }

    [part~=zero-ruler] {
        position: absolute;
    }

    :host(:not([flip-axes])) [part~=zero-ruler] {
        top: 0;
        height: 2px;
        left: 0;
        right: 0;
    }

    :host([flip-axes]) [part~=zero-ruler] {
        left: 0;
        width: 2px;
        top: 0;
        bottom: 0;
    }

    :host([front-rulers]) [part=rulers] {
        z-index: 12;
    }

    [part~=refline] {
        position: absolute;
        z-index: 13;
    }

    :host(:not([is-reference-lines])) [part~=refline] {
        display: none;
    }

    :host([flip-axes]) [part~=refline] {
        top: 0;
        bottom: -4px;
        left: 0;
        width: 0px;
        height: 100%
    }
    </style>

    <div part="xaxis-slot"><slot name="xaxis"></slot></div>
    <div part="yaxis-slot"><slot name="yaxis"></slot></div>
    <div part="xaxis2-slot"><slot name="xaxis2"></slot></div>
    <div part="yaxis2-slot"><slot name="yaxis2"></slot></div>
    <div part="rulers" hidden\$="[[sparkView]]">
      <div id="xrulers"></div>
      <div id="x2rulers"></div>
      <div id="yrulers"></div>
      <div id="y2rulers"></div>
      <div id="zero" part="zero-ruler ruler"></div>
    </div>
    <div part="chart-slot"><slot name="chart"></slot></div>`;
    }

    static get is() {
        return 'ptcs-chart-coord';
    }

    static get properties() {
        return {
            // Swap xaxis and xaxis2
            flipXAxis: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // Swap yaxis and yaxis2
            flipYAxis: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // Flip axes (change place on xaxes and yaxes)
            flipAxes: {
                type:               Boolean,
                reflectToAttribute: true
            },

            hideZeroRuler: {
                type:               Boolean,
                reflectToAttribute: true
            },

            showXRulers: {
                type:               Boolean,
                reflectToAttribute: true
            },

            showX2Rulers: {
                type:               Boolean,
                reflectToAttribute: true
            },

            frontRulers: {
                type:               Boolean,
                reflectToAttribute: true
            },

            xTicks: {
                type: Array
            },

            x2Ticks: {
                type: Array
            },

            showYRulers: {
                type:               Boolean,
                reflectToAttribute: true
            },

            showY2Rulers: {
                type:               Boolean,
                reflectToAttribute: true
            },

            yTicks: {
                type: Array
            },

            y2Ticks: {
                type: Array
            },

            isReferenceLines: {
                type:               Boolean,
                reflectToAttribute: true
            },

            _resizeObserver: ResizeObserver,

            graphWidth: {
                type:   Number,
                notify: true
            },

            graphHeight: {
                type:   Number,
                notify: true
            },

            // Hide rulers on spark mode
            sparkView: {
                type:  Boolean,
                value: false
            },

            // Show rulers for the Y-axis: 'primary' or 'secondary'
            yAxisRulerAlignment: {
                type: String
            },

            hasY2: {
                type: Boolean
            },

            yScale: {
                type: Function
            },

            y2Scale: {
                type: Function
            }
        };
    }

    static get observers() {
        return [
            '_xRulers(flipAxes, showXRulers, xTicks, "xrulers")',
            '_xRulers(flipAxes, showX2Rulers, x2Ticks, "x2rulers", isReferenceLines)',
            '_yRulers(flipAxes, showYRulers, yTicks, "yrulers", yAxisRulerAlignment, hasY2, yScale)',
            '_yRulers(flipAxes, showY2Rulers, y2Ticks, "y2rulers", yAxisRulerAlignment, hasY2, y2Scale, isReferenceLines)'
        ];
    }

    ready() {
        super.ready();
        this._resizeObserver = new ResizeObserver(entries => {
            const rect = entries[0].contentRect;
            this.setProperties({graphWidth: rect.width, graphHeight: rect.height});
        });

        // Don't show zero-ruler unless it is ready
        if (!this.$.zero.style.transform) {
            this.$.zero.style.display = 'none';
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this._resizeObserver.observe(this.shadowRoot.querySelector('[part=chart-slot]'));
    }

    disconnectedCallback() {
        this._resizeObserver.unobserve(this.shadowRoot.querySelector('[part=chart-slot]'));
        super.disconnectedCallback();
    }

    _xRulers(flipAxes, showXRulers, xTicks, rulersId, isReferenceLines) {
        const setPos = flipAxes
            ? d => `translate(0,${d.offs}px)`
            : d => `translate(${d.offs}px,0)`;

        const partData = isReferenceLines ? 'refline x-refline' : 'ruler x-ruler';
        const join = select(this.$[rulersId])
            .selectAll('[part="' + partData + '"]')
            .data((showXRulers && Array.isArray(xTicks)) ? xTicks : []);

        // Enter
        join.enter()
            .append('div')
            .attr('part', partData)
            .style('transform', setPos);

        // Update
        join.style('transform', setPos);

        // Exit
        join.exit().remove();
    }

    _yRulers(flipAxes, showYRulers, yTicks, rulersId, yAxisRulerAlignment, hasY2, yScale, isReferenceLines) {
        const setPos = flipAxes
            ? d => `translate(${d.offs}px,0)`
            : d => `translate(0,${d.offs}px)`;

        // Show zero ruler for the primary Y Axis if we don't have Y2 data or the rulers are aligned to the primary Y Axis.
        // Show zero ruler for the second Y Axis if we have Y2 data and the rulers are aligned to the second Y Axis.
        if ((rulersId === 'yrulers' && (!yAxisRulerAlignment || yAxisRulerAlignment === 'primary' || !hasY2)) ||
            (rulersId === 'y2rulers' && yAxisRulerAlignment === 'secondary' && hasY2)) {
            this._showZeroRuler(flipAxes, yScale, setPos);
        }

        const partData = isReferenceLines ? 'refline y-refline' : 'ruler y-ruler';
        const join = select(this.$[rulersId])
            .selectAll('div[part]')
            .data((showYRulers && Array.isArray(yTicks)) ? yTicks : []);

        // Enter
        join.enter()
            .append('div')
            .attr('part', partData)
            .style('transform', setPos);

        // Update
        join.style('transform', setPos);

        // Exit
        join.exit().remove();
    }

    // Zero ruler
    _showZeroRuler(flipAxes, yScale, setPos) {
        const zeroPt = typeof yScale === 'function' ? yScale(0) : NaN;
        const zeroEl = this.$.zero;
        const style = zeroEl.style;
        if (zeroPt) {
            // For now, we *always* emit the zero line even in the edge cases to ensure that the
            // zero ruler isn't *completely* hidden in the edge cases
            const zeroDim = flipAxes ? zeroEl.clientWidth : zeroEl.clientHeight;
            style.transform = setPos({offs: zeroPt - zeroDim / 2 + 1});
            style.display = '';
            return;
        }
        style.display = 'none';
    }

};

customElements.define(PTCS.ChartCoord.is, PTCS.ChartCoord);
