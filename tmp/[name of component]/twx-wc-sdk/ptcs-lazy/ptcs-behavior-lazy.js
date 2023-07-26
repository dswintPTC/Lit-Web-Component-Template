import {PTCS} from 'ptcs-library/library.js';

export const BehaviorLazy = superClass => class Lazy extends superClass {
    static get properties() {
        return {
            hidden: {
                type:     Boolean,
                value:    false,
                observer: '_hiddenChanged',
                reflect:  true,
                notify:   true,
            },
            loaded: {
                type:     Boolean,
                value:    false,
                reflect:  true,
                readOnly: true,
            },
            loading: {
                type:     Boolean,
                value:    false,
                reflect:  true,
                readOnly: true,
            },
            unloading: {
                type:     Boolean,
                value:    false,
                reflect:  true,
                readOnly: true,
            },
        };
    }

    // shouldLazyLoad
    // shouldReload
    // shouldUnload

    ready() {
        super.ready();
        this.init().then(() => {
            this.initialized = true;
            if (this.hidden === false) {
                this._hiddenChanged(false);
            }
        });
    }

    /* istanbul ignore next: abstract */
    async init() {}

    _hiddenChanged(hidden, old) {
        /* istanbul ignore else: dynamic child creation */
        if (this.initialized && hidden !== old) {
            if (hidden === false) {
                if (!this.loaded) {
                    if (this.shouldLazyLoad) {
                        this.load();
                    }
                } else if (this.shouldReload) {
                    this.reload();
                }
            } else if (this.loaded) {
                if (this.shouldUnload) {
                    this.unload();
                }
            }
        }
    }

    _finishLoad() {
        this._setLoading(false);
        this._setLoaded(true);
        this.dispatchEvent(new CustomEvent('loaded'));
    }

    _finishUnload() {
        this._setUnloading(false);
        this._setLoaded(false);
        this.dispatchEvent(new CustomEvent('unloaded'));
    }

    async load() {
        this._setLoading(true);
        this.performUpdate();
        this.dispatchEvent(new CustomEvent('loading'));
        await this.realLoad();
        this._finishLoad();
    }

    /* istanbul ignore next: abstract */
    async realLoad() {}

    async unload() {
        this._setUnloading(true);
        this.performUpdate();
        this.dispatchEvent(new CustomEvent('unloading'));
        await this.realUnload();
        this._finishUnload();
    }

    /* istanbul ignore next: abstract */
    async realUnload() {}

    async reload() {
        await this.unload();
        await this.load();
    }
};

PTCS.BehaviorLazy = BehaviorLazy;
