/* eslint-disable no-confusing-arrow */
export class AnimScroller {
    // items: [{el, h, state: undefined | 'insert' | 'remove' }]
    // opt:
    //  - finishedCb:    callback when animation completes
    //  - recyleEl:      el => recyle element
    //  - animationTime: animation time in ms
    constructor(items, opt) {
        this._finishedCb = (opt && opt.finishedCb) || (() => undefined);
        this._recyleEl = (opt && opt.recycleEl) || (el => el.remove());
        this._animationTime = (opt && opt.animationTime) || 250;
        this._run(items, (opt && opt.dy) || 0);
    }

    _run(items, dy) {
        let y0 = dy;
        let y1 = 0;
        for (let i = items.findIndex(item => item.topmost); i > 0; i--) {
            y0 -= items[i - 1].h;
        }
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            item.y0 = y0;
            item.y1 = y1;
            if (item.state !== 'remove') {
                y1 += item.h;
            }
            if (item.state !== 'insert') {
                y0 += item.h;
            }
        }

        items.forEach((item, i) => {
            const from = {};
            const to = {};

            if (item.state === 'remove') {
                from.transform = `translateY(${item.y0}px) scaleY(1)`;
                to.transform = `translateY(${item.y1}px) scaleY(0)`;
            } else if (item.state === 'insert') {
                from.transform = `translateY(${item.y0}px) scaleY(0)`;
                to.transform = `translateY(${item.y1}px) scaleY(1)`;
            } else if (item.y0 !== item.y1) {
                from.transform = `translateY(${item.y0}px)`;
                to.transform = `translateY(${item.y1}px)`;
            } else {
                return;
            }

            item.el.style.transformOrigin = 'top';
            item.anim = item.el.animate([from, to], this._animationTime);

            // Handle animation end
            item.anim.finished.then(() => {
                item.anim.cancel();
                item.anim = null;
                if (item.state === 'remove') {
                    item.el.style.transformOrigin = '';
                    this._recyleEl(item.el);
                }
                if (!items.find(item2 => item2.anim)) {
                    // The animation has completed
                    this._finishedCb();
                }
            }).catch(e => {
                console.log(e);
                // Ignore cancelled animations
                if (!(e instanceof DOMException) && e.code === 20) {
                    console.error(e);
                }
            });
        });
    }
}
