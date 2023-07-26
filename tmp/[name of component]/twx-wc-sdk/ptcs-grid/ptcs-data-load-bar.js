import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {PTCS} from 'ptcs-library/library.js';
import {createSubComponent} from 'ptcs-library/create-sub-component.js';
import 'ptcs-behavior-styleable/ptcs-behavior-styleable.js';
import 'ptcs-image/ptcs-image.js';

/* Don't need a warning to make sure I have not confused "=>" with ">=" or "<=" */
/* eslint-disable no-confusing-arrow */

PTCS.DataLoadBar = class extends PTCS.BehaviorStyleable(PTCS.ThemableMixin(PolymerElement)) {
    static get template() {
        return html`
        <style>
            :host {
                display: inline-block;
            }

            [part=bar-container] {
              position: absolute;
              align-items: center;
              justify-content: center;
            }

            :host(:not([show-bar])) [part=bar-container] {
              display: none;
            }

            :host([show-bar]) [part=bar-container] {
              display: flex;
            }

            :host([image-option]) [part=track] {
              display: none;
            }

            :host(:not([image-option])) [part=image] {
              display: none;
            }

            [part=track] {
               overflow: hidden;
            }

            [part=slider] {
               position: relative;
               animation: slider 2s linear 0s infinite normal both;
            }

            @keyframes slider {
              from {left: 0%;}
              to {left: 100%;}
            }

            [part=image] {
               animation: fadeIn 1s infinite alternate;
            }

            @keyframes fadeIn {
               from { opacity: 0.25; }
            }

        </style>
        <div part="bar-container" id="bar-container">
            <div part="track"><div part="slider"></div></div>
        </div>`;
    }

    static get is() {
        return 'ptcs-data-load-bar';
    }

    static get properties() {
        return {
            // Show custom image instead of the default load indicator?
            imageOption: {
                type:               Boolean,
                reflectToAttribute: true
            },

            // Image to display instead of the default animated bar
            image: {
                type:     String,
                observer: '_imageChanged'
            },

            // Container size for the load indicator (bar / image)
            size: {
                type:     Number,
                value:    200,
                observer: '_sizeChanged'
            },

            // Delay in ms until the data loading is shown
            delay: {
                type:  Number,
                value: 0
            },

            // Flag to display data loading / progress bar indicator
            showBar: {
                type:     Boolean,
                observer: '_showBarChanged'
            }
        };
    }

    _showBarChanged(showBar) {
        if (showBar) {
            setTimeout(() => {
                if (this.showBar) {
                    this.setAttribute('show-bar', '');
                }
            }, this.delay);
        } else {
            this.removeAttribute('show-bar');
        }
    }

    _imageChanged(image) {
        if (!this.$['bar-container'].querySelector('ptcs-image')) {
            const img = createSubComponent(this, '<ptcs-image part="image" size="contain" position="center" src="[[image]]" no-placeholder$="">');
            img.addEventListener('error', () => {
                this.imageOption = false;
            });
            img.addEventListener('load', () => {
                this.imageOption = true;
            });
            this.$['bar-container'].appendChild(img);
        }
        if (!image) {
            this.imageOption = false;
        }
    }

    _sizeChanged(size) {
        this.$['bar-container'].style.height = size + 'px';
        this.$['bar-container'].style.width = size + 'px';
        const centered = `calc(50% - ${size / 2}px)`;
        this.$['bar-container'].style.left = centered;
        this.$['bar-container'].style.top = centered;
    }

};

customElements.define(PTCS.DataLoadBar.is, PTCS.DataLoadBar);
