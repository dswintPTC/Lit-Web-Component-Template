import {DrawBase} from './ptcs-chart-draw-base';
import {removeChildren} from './ptcs-chart-draw-library';

export class DrawPlot extends DrawBase {
    constructor(seriesIx, data, allIxs, marker, markerSize, showValues, valueFormat, zIndex) {
        super(seriesIx, data, allIxs, zIndex);
        this._marker = marker;
        this._markerSize = markerSize;
        this._showValues = showValues;
        this._valueFormat = valueFormat;
    }

    draw({el}) {
        removeChildren(el);
    }

    updateSelection() {
        // Do nothing
    }
}
