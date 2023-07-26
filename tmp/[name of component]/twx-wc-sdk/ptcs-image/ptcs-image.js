import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import 'ptcs-label/ptcs-label.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-behavior-tooltip/ptcs-behavior-tooltip.js';

// eslint-disable-next-line max-len
const defaultImagePlaceholder = 'data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDM0IDM0IiB3aWR0aD0iNjgiIGhlaWdodD0iNjgiIGZpbGw9IiM2RTcxN0MiPjxwYXRoIGQ9Ik0yMS41LDE1Yy0wLjgsMC0xLjUtMC43LTEuNS0xLjVzMC43LTEuNSwxLjUtMS41czEuNSwwLjcsMS41LDEuNSAgUzIyLjMsMTUsMjEuNSwxNUwyMS41LDE1eiBNMTQsMTguMmwyLjEsMi41bDMtMy44bDMuOSw1SDExTDE0LDE4LjJ6IE0yNiwyMi4yVjExLjhjMC0xLTAuNy0xLjgtMS42LTEuOEg5LjZDOC43LDEwLDgsMTAuOCw4LDExLjggIHYxMC41YzAsMSwwLjcsMS44LDEuNiwxLjhoMTQuN0MyNS4zLDI0LDI2LDIzLjIsMjYsMjIuMkwyNiwyMi4yeiI+PC9wYXRoPjwvc3ZnPg==';

PTCS.Image = class extends PTCS.BehaviorTooltip(PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement))) {
    static get template() {
        return html`
    <style>
      :host {
        /* Must use inline-flex; inline-block adds vertical space */
        display: inline-flex;
        overflow: hidden;

        justify-content: center; /* When the image is shown in actual size it should be in the middle of the container */
      }

      :host([container-dim]) {
        width:  100%;
        height: 100%;
      }

      #root {
        width:  100%;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        background-repeat: no-repeat;
        overflow: hidden;
        box-sizing: border-box;
      }

      img {
        flex-shrink: 0;
      }

      :host([container-dim]) img {
        display: none;
      }

      :host [part=alt-label] {
        display: none;
      }

      :host([error][alt]:not([alt=''])) [part=alt-label] {
        display: inline-flex;
        align-self: center;
      }
    </style>

    <div id="root" part="image">
      <img id="img" src\$="[[_src]]" on-load="_onLoad" hidden\$="[[_imageHidden]]" on-error="_onError">
      <ptcs-label part="alt-label" label="[[alt]]" variant="[[labelVariant]]"></ptcs-label>
    </div>
`;
    }

    static get is() {
        return 'ptcs-image';
    }

    static get properties() {
        return {
            // Image source / url
            src: {
                type: String
            },

            // Computed source
            _src: {
                type:     String,
                computed: '_computeSrc(src, preventCaching, noPlaceholder)'
            },

            // Alt text
            alt: {
                type:               String,
                reflectToAttribute: true
            },

            tooltip: {
                computed: '_getTooltip(alt)'
            },

            // ptcs-label variant for the alt text
            labelVariant: {
                type:  String,
                value: 'label'
            },

            // Actual width of image
            _widthImg: {
                type: Number
            },

            // Actual height of image
            _heightImg: {
                type: Number
            },

            // = keyword | length | length 'auto' | 'auto' length | length length
            size: {
                type:  String,
                value: 'auto'
            },

            // width part of size
            _sizeW: {
                type: String
            },

            // height part of size
            _sizeH: {
                type: String
            },

            // The specified width of this widget
            _widthCntr: {
                type:     String,
                computed: '_computeDim(containerDim, _sizeW, _widthImg)'
            },

            // The specified height of this widget
            _heightCntr: {
                type:     String,
                computed: '_computeDim(containerDim, _sizeH, _heightImg)'
            },

            // Are image dimensions inherited from the container?
            containerDim: {
                type:               Boolean,
                computed:           '_computeContainerDim(size, _src)',
                reflectToAttribute: true
            },

            // style.backgroundSize
            _backgroundSize: {
                type:     String,
                computed: '_computeBackgroundSize(containerDim, size, _src)',
                observer: '_backgroundSizeChanged'
            },

            // style.backgroundPosition
            position: {
                type:     String,
                observer: '_positionChanged'
            },

            // error loading image
            error: {
                type:               Boolean,
                value:              false,
                reflectToAttribute: true
            },

            // Prevents the image source from being cached so that the most recent version is shown when reloaded
            preventCaching: {
                type:  Boolean,
                value: false
            },

            // don't show placeholder image if the src property is not populated
            noPlaceholder: {
                type: Boolean
            },

            // The placeholder that is currently being used, if any
            _usingPlaceholder: {
                type:     String,
                observer: '_usingPlaceholderChanged'
            },

            // don't show image if we need first to calculate the size
            _imageHidden: {
                type:  Boolean,
                value: false
            },

            // ARIA attributes

            ariaLabel: {
                type:               String,
                computed:           '_computeAriaLabel(alt)',
                reflectToAttribute: true
            },

            role: {
                type:               String,
                value:              'img',
                reflectToAttribute: true
            }

        };
    }

    static get observers() {
        return [
            '_srcChanged(containerDim, _src)',
            '_sizeChanged(size, _src)',
            '_widthCntrChanged(containerDim, error, _widthCntr)',
            '_heightCntrChanged(containerDim, error, _heightCntr)'
        ];
    }

    // Get current placeholder image
    static get placeholderImage() {
        return PTCS.Image.__placeholderImage || defaultImagePlaceholder;
    }

    // Set a new placeholder image
    static set placeholderImage(image) {
        PTCS.Image.__placeholderImage = image;

        // Force redrawing?
        if (PTCS.Image.__watch) {
            // Must take out affected element before we force-redraw them, or we may spiral into an eternal loop
            let list = [];
            PTCS.Image.__watch.forEach(el => {
                if (typeof el._usingPlaceholder === 'string') {
                    list.push(el);
                }
            });

            list.forEach(el => {
                el.noPlaceholder = !el.noPlaceholder;
                el.noPlaceholder = !el.noPlaceholder;
            });
        }

        return image;
    }

    static _watchPlaceholder(image) {
        if (typeof image._usingPlaceholder === 'string') {
            if (!PTCS.Image.__watch) {
                PTCS.Image.__watch = new Set();
            }
            PTCS.Image.__watch.add(image);
        } else {
            this._unwatchPlaceholder(image);
        }
    }

    static _unwatchPlaceholder(image) {
        if (PTCS.Image.__watch) {
            PTCS.Image.__watch.delete(image);
        }
    }

    connectedCallback() {
        super.connectedCallback();
        PTCS.Image._watchPlaceholder(this);
    }

    disconnectedCallback() {
        PTCS.Image._unwatchPlaceholder(this);
        super.disconnectedCallback();
    }

    _usingPlaceholderChanged(_usingPlaceholder) {
        PTCS.Image._watchPlaceholder(this);
    }

    // Image has been loaded
    _onLoad() {
        const _natImgWidth = this.$.img.naturalWidth;
        const _natImgHeight = this.$.img.naturalHeight;

        this.setProperties({
            error:      this.error && this._usingPlaceholder === PTCS.Image.placeholderImage,
            _widthImg:  _natImgWidth,
            _heightImg: _natImgHeight,
        });

        this._imageHidden = false;
        if (this._src !== PTCS.Image.placeholderImage) {
            this.dispatchEvent(new CustomEvent('load', {
                bubbles:  true, composed: true,
                detail:   {naturalWidth: _natImgWidth, naturalHeight: _natImgHeight}
            }));
        }
    }

    // Image cannot be loaded
    _onError() {
        this.setProperties({error: true, _widthImg: 0, _heightImg: 0});

        this._imageHidden = false;
        this.src = null;

        // Give the system 150ms to load the placeholder image
        setTimeout(() => {
            /* istanbul ignore else */
            if (this.error) {
                this.dispatchEvent(new CustomEvent('error', {bubbles: false, composed: false, detail: {}}));
            }
        }, 150);
    }

    _srcChanged(containerDim, _src) {
        this.$.root.style.backgroundImage = (containerDim && _src) ? `url(${PTCS.rectifyURI(_src)})` : '';
    }

    _sizeChanged(size, _src) {
        if (typeof size !== 'string') {
            size = '';
        }

        let sizeW = 'auto';
        let sizeH = 'auto';

        if (_src && !this._usingPlaceholder) { // don't apply size options if there is no image (i.e. placeholder image)
            const m = /^\s*(\S+)(\s+(\S+)\s*)?$/.exec(size.toLowerCase());

            if (!m) {
                // Invalid specification
                console.warn(`invalid ptcs-image size: '${JSON.stringify(size)}'`);
            } else if (m[3]) {
                // Two properties: length 'auto' | 'auto' length | length length
                sizeW = this._decodeSize(m[1]);
                sizeH = this._decodeSize(m[3]);
            } else {
                // One property: keyword | length
                switch (size) {
                    case 'auto':
                        break;
                    case 'contain':
                    case 'fit':
                    case 'cover':
                        sizeW = sizeH = '100%';
                        break;
                    case 'fit-x':
                        sizeW = '100%';
                        break;
                    case 'fit-y':
                        sizeH = '100%';
                        break;
                    case 'small':
                        sizeW = sizeH = '34px';
                        break;
                    case 'medium':
                        sizeW = sizeH = '40px';
                        break;
                    case 'large':
                        sizeW = sizeH = '80px';
                        break;
                    case 'xlarge':
                        sizeW = sizeH = '140px';
                        break;
                    default:
                        sizeW = this._decodeSize(m[1]);
                        sizeH = 'auto';
                }
            }
        }

        // Hide the image in case it's still loading and the size is defined in percents (TW-87944)
        if ((typeof sizeW === 'number' || typeof sizeH === 'number') &&
            (this._src && !PTCS.imgLoaded(this.$.img))) {
            this._imageHidden = true;
        }

        this.setProperties({_sizeW: sizeW, _sizeH: sizeH});
    }

    _decodeSize(size) {
        const m = /^(\d+(\.\d*)?)(\S*)$/.exec(size);

        if (m) {
            const unit = m[3] || 'px';

            if (unit !== '%') {
                return m[1] + unit;
            }

            // Percentage of image dimension
            return Number(m[1]);
        }

        // Invalid value
        return 'auto';
    }

    _computeDim(containerDim, size, dim) {
        if (containerDim) {
            return '100%';
        }

        // Percentage of image dimension?
        if (typeof size === 'number') {
            return dim > 0 ? `${(size * dim) / 100}px` : '';
        }

        return size || '';
    }

    _widthCntrChanged(containerDim, error, widthCntr) {
        if (containerDim || error) {
            this.$.root.style.width = widthCntr;
        } else {
            this.$.root.style.width = '';
            this.$.img.style.width = widthCntr;
        }
    }

    _heightCntrChanged(containerDim, error, heightCntr) {
        if (containerDim || error) {
            this.$.root.style.height = heightCntr;
        } else {
            this.$.root.style.height = '';
            this.$.img.style.height = heightCntr;
        }
    }

    // Are image dimensions inherited from the container?
    _computeContainerDim(size, _src) {
        const _size = typeof size === 'string' ? size.trim().toLowerCase() : '';

        if (!_src || this._usingPlaceholder) {
            return false;
        }

        switch (_size) {
            case 'contain':
            case 'cover':
            case 'fit':
            case 'fit-x':
            case 'fit-y':
                return true;
        }
        return false;
    }

    // $.root.style.backgroundSize
    _computeBackgroundSize(containerDim, size, _src) {
        if (!containerDim || !_src || this._usingPlaceholder) {
            return ''; // No background image
        }

        const _size = size ? size.trim().toLowerCase() : '';

        switch (_size) {
            case 'contain':
            case 'cover':
                return _size;
            case 'fit-x':
                return '100% auto';
            case 'fit-y':
                return 'auto 100%';
        }

        return '100% 100%';
    }

    _backgroundSizeChanged(backgroundSize) {
        this.$.root.style.backgroundSize = backgroundSize;
    }

    // $.root.style.backgroundPosition
    _positionChanged(position) {
        this.$.root.style.backgroundPosition = position || '';
        this.$.root.style.justifyContent = 'center';
        this.$.root.style.alignItems = 'center';
        switch (position) {
            case 'top':
                this.$.root.style.alignItems = 'flex-start';
                break;
            case 'bottom':
                this.$.root.style.alignItems = 'flex-end';
                break;
            case 'left':
                this.$.root.style.justifyContent = 'flex-start';
                break;
            case 'right':
                this.$.root.style.justifyContent = 'flex-end';
                break;
        }
    }

    _computeSrc(src, preventCaching, noPlaceholder) {
        if (!src) {
            this._usingPlaceholder = noPlaceholder ? undefined : PTCS.Image.placeholderImage;
            return this._usingPlaceholder;
        }

        if (this._usingPlaceholder) {
            this._usingPlaceholder = undefined;
        }

        return src + (preventCaching ? '?' + new Date().getTime() : '');
    }

    get naturalImgWidth() {
        return this._widthImg;
    }

    get naturalImgHeight() {
        return this._heightImg;
    }

    get imgWidth() {
        return this.$.img.width;
    }

    get imgHeight() {
        return this.$.img.height;
    }

    _getTooltip(alt) {
        return alt;
    }

    // ARIA attributes
    _computeAriaLabel(alt) {
        return alt || '';
    }
};

customElements.define(PTCS.Image.is, PTCS.Image);

export const Image = PTCS.Image;
