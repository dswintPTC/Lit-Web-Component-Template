import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import {select} from 'd3-selection';

PTCS.ChartBands = class extends PTCS.BehaviorStyleable(PolymerElement) {
    static get template() {
        return html`
            <style>
                :host {
                    display: block;
                }

                :host, #bands {
                    width: 100%;
                    height: 100%;
                }

                #bands {
                    position: relative;
                    display: none;
                }

                :host([show-chart-bands]) #bands{
                    display: block;
                }

                .band {
                    position: absolute;
                    bottom: 0;
                    top: 0;
                }

                :host([flip-axes]) .band {
                    left: 0;
                    right: 0;
                }
            </style>

            <div id="bands"></div>
        `;
    }

    static get is() {
        return 'ptcs-chart-bands';
    }

    static get properties() {
        return {
            innerPadding: {
                type: Number
            },

            outerPadding: {
                type: Number
            },

            bandWidth: {
                type: Number
            },

            flipAxes: {
                type:               Boolean,
                reflectToAttribute: true
            },

            showChartBands: {
                type:               Boolean,
                reflectToAttribute: true
            }
        };
    }

    static get observers() {
        return [
            '_renderBands(flipAxes, bandwidth, innerPadding, outerPadding)'
        ];
    }

    _renderBands() {
        if (this.__renderOn) {
            return;
        }

        this.__renderOn = true;

        requestAnimationFrame(() => {
            this.__renderOn = false;
            this.__renderBands();
        });
    }

    __renderBands() {
        const br = this.getBoundingClientRect();
        const range = this.flipAxes ? br.height : br.width;

        if (range <= 0 || !this.bandwidth || !this.innerPadding) {
            // Not ready yet
            this.$.bands.replaceChildren();
            return;
        }

        const outerPadding = this.outerPadding ? this.outerPadding : 0;
        const bandwidth = this.bandwidth;
        const step = bandwidth + this.innerPadding;
        const bandsNum = Math.floor((range - 2 * outerPadding) / step) + 1;
        const bands = new Array(bandsNum);

        const pos = i => outerPadding + i * step;

        function drawVerticalBand(d, i) {
            this.style.heigth = '';
            this.style.width = `${bandwidth}px`;
            this.style.top = '';
            this.style.left = `${pos(i)}px`;
        }

        function drawHorizontalBand(d, i) {
            this.style.height = `${bandwidth}px`;
            this.style.width = '';
            this.style.top = `${pos(i)}px`;
            this.style.left = '';
        }

        const drawBand = this.flipAxes ? drawHorizontalBand : drawVerticalBand;

        const join = select(this.$.bands)
            .selectAll('div.band')
            .data(bands);

        // Enter
        join.enter()
            .append('div')
            .attr('class', 'band')
            .attr('part', 'band')
            .each(drawBand);

        // Update
        join.each(drawBand);

        // Exit
        join.exit().remove();
    }
};

customElements.define(PTCS.ChartBands.is, PTCS.ChartBands);
