import {DrawBase} from './ptcs-chart-draw-base';
import {line} from 'd3-shape';
import {removeChildren, steps} from './ptcs-chart-draw-library';

export class DrawLine extends DrawBase {
    constructor(seriesIx, data, allIxs, curve, marker, markerSize, showValues, valueFormat, zIndex) {
        super(seriesIx, data, allIxs, zIndex);
        this._curve = curve;
        this._marker = marker;
        this._markerSize = markerSize;
        this._showValues = showValues;
        this._valueFormat = valueFormat;
    }

    get chartType() {
        return steps.has(this._curve) ? 'step' : 'line';
    }

    _drawLine(path, {xScale, yScale, flipAxes}) {
        const {xPos, yPos} = this._coordinates(xScale, yScale);

        const d3line = flipAxes
            ? line().x(d => yPos(d)).y(d => xPos(d))
            : line().x(d => xPos(d)).y(d => yPos(d));

        path.setAttribute('part', 'line');
        path.setAttribute('legend', this._legend);
        path.setAttribute('d', d3line.curve(this._curve)(this._xix));
    }

    draw(options) {
        const el = options.el;

        if (this._hidden || this._xix.length === 0) {
            removeChildren(el);
            return;
        }

        let path = el.firstElementChild;

        // Create new path element to render line
        const addPath = () => {
            path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            el.appendChild(path);
            return path;
        };

        if (!path) {
            // Create path
            path = addPath();
        } else {
            // Exactly one 'path' for lines
            while (el.lastElementChild !== path) {
                el.lastElementChild.remove();
            }

            if (path.tagName !== 'path') {
                path.remove();
                path = addPath();
            }
        }

        this._drawLine(path, options);
    }

    updateSelection() {
        // Do nothing
    }
}
