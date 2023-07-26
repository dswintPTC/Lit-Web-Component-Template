// A simple QudTree that only supports adding areas as long as there are no collisions
// Used to quickly detect label collisions in charts

/* eslint-disable no-confusing-arrow */

// Bounding boxes are stored as: [x1, y1, x2, y2]
// Objects are bounding boxes
// Q nodes are stored as: [[objects], Q1, Q2, Q3, Q4]. The quadrants (sub Q nodes) are not available on leaf nodes

// Create leaf Q node
const newQ = () => [[]]; // Empty object list, no quadrants

// Get quadrant of Q node. Create if necessary
const getQ = (q, i) => q[i] ? q[i] : (q[i] = newQ());

// Add object to Q node
const addObj = (q, obj) => q[0].push(obj);

// Do ranges a1 - a2 and b1 - b2 overlap?
const overlap = (a1, a2, b1, b2) => (Math.min(a2, b2) - Math.max(a1, b1)) > 0;
const intersect = (obj1, obj2) => overlap(obj1[0], obj1[2], obj2[0], obj2[2]) && overlap(obj1[1], obj1[3], obj2[1], obj2[3]);

// Do Q node have any objects that collides with obj?
const collision = (q, obj) => q[0].some(_obj => intersect(_obj, obj));

// Is Q node a leaf node?
const isLeaf = q => q.length === 1; // if it hasn't been split into quadrants ...

// Is Q node full?
const overflow = q => q[0].length > 12; // 12 is arbitrary. Has not been fine-tuned or profiled

// Get quadrant boundaries of area: x and y is the precomputed mid point
const Q1 = (area, x, y) => [area[0], area[1], x, y];
const Q2 = (area, x, y) => [x, area[1], area[2], y];
const Q3 = (area, x, y) => [area[0], y, x, area[3]];
const Q4 = (area, x, y) => [x, y, area[2], area[3]];

// A simple QudTree that (only) supports adding areas as long as there are no collisions
class SimpleQuadTree {
    constructor(w, h) {
        this.w = w;
        this.h = h;
        this.q = newQ();
    }

    // Try to add non-colliding area to QuadTree
    add(x, y, w, h) {
        const obj = [x, y, x + w, y + h];

        // Note: the Q node areas are re-computed for every call. The computations are quick and saves memory.
        // It does however cause some computional overhead. If the profiler would ever say that this is a problem,
        // the areas can be stored in each Q node instead
        const qarea = [0, 0, this.w, this.h];

        if (!intersect(obj, qarea)) {
            //console.warn('invalid call: ' + JSON.stringify({obj, qarea}));
            return false;
        }

        return this._add(obj, this.q, qarea);
    }

    // Try to add non-colliding object to Q node with area
    _add(obj, q, qarea) {
        console.assert(intersect(obj, qarea));

        if (collision(q, obj)) {
            return false;
        }

        if (isLeaf(q)) {
            addObj(q, obj);

            if (overflow(q)) {
                this._split(q, qarea);
            }

            return true;
        }

        // Center of area
        const x = (qarea[0] + qarea[2]) / 2;
        const y = (qarea[1] + qarea[3]) / 2;

        if (obj[2] < x) { // obj.x2 < x
            if (obj[3] < y) { // obj.y2 < y
                return this._add(obj, getQ(q, 1), Q1(qarea, x, y));
            }
            if (obj[1] > y) { // obj.y1 > y
                return this._add(obj, getQ(q, 3), Q3(qarea, x, y));
            }
            if (this._fitQ1(obj, q, qarea, x, y) && this._fitQ3(obj, q, qarea, x, y)) {
                addObj(q, obj); // obj fits, and resides on the Q1 / Q2 border, so it must be stored here
                return true;
            }
            return false;
        }

        if (obj[0] > x) { // obj.x1 > x
            if (obj[3] < y) { // obj.y2 < y
                return this._add(obj, getQ(q, 2), Q2(qarea, x, y)); // Q2
            }
            if (obj[1] > y) { // obj.y1 > y
                return this._add(obj, getQ(q, 4), Q4(qarea, x, y)); // Q4
            }
            if (this._fitQ2(obj, q, qarea, x, y) && this._fitQ4(obj, q, qarea, x, y)) {
                addObj(q, obj); // obj fits, and resides on the Q2 / Q4 border
                return true;
            }
            return false;
        }

        if (this._fitQ1(obj, q, qarea, x, y) && this._fitQ2(obj, q, qarea, x, y) &&
            this._fitQ3(obj, q, qarea, x, y) && this._fitQ4(obj, q, qarea, x, y)) {
            addObj(q, obj); // obj fits, and resides on the Q1 / Q2 / Q3 / Q4 borders
            return true;
        }

        return false;
    }

    _split(q, qarea) {
        // Grab objects that has gathered on this area
        const a = q[0];
        q[0] = [];

        // Split area into qudrants. Make sure the q-array remains non-holey (significantly faster and smaller)
        q.push(undefined); // Q1
        q.push(undefined); // Q2
        q.push(undefined); // Q3
        q.push(undefined); // Q4

        // Distribute objects into new quadrants
        a.forEach(obj => console.assert(this._add(obj, q, qarea)));
    }

    _fitQ1(obj, q, qarea, x, y) {
        return !q[1] || this._fit(obj, q[1], Q1(qarea, x, y));
    }

    _fitQ2(obj, q, qarea, x, y) {
        return !q[2] || this._fit(obj, q[2], Q2(qarea, x, y));
    }

    _fitQ3(obj, q, qarea, x, y) {
        return !q[3] || this._fit(obj, q[3], Q3(qarea, x, y));
    }

    _fitQ4(obj, q, area, x, y) {
        return !q[4] || this._fit(obj, q[4], Q4(area, x, y));
    }

    _fit(obj, q, qarea) {
        if (collision(q, obj)) {
            return false;
        }

        if (isLeaf(q)) {
            return true;
        }

        const x = (qarea[0] + qarea[2]) / 2;
        const y = (qarea[1] + qarea[3]) / 2;

        if (obj[2] < x) { // obj.x2 < x
            if (obj[3] < y) { // obj.y2 < y
                return this._fitQ1(obj, q, qarea, x, y);
            }
            if (obj[1] > y) { // obj.y1 > y
                return this._fitQ3(obj, q, qarea, x, y);
            }
            return this._fitQ1(obj, q, qarea, x, y) && this._fitQ3(obj, q, qarea, x, y);
        }

        if (obj[0] > x) { // obj.x1 > x
            if (obj[3] < y) { // obj.y2 < y
                return this._fitQ2(obj, q, qarea, x, y);
            }
            if (obj[1] > y) { // obj.y1 > y
                return this._fitQ4(obj, q, qarea, x, y);
            }
            return this._fitQ2(obj, q, qarea, x, y) && this._fitQ4(obj, qarea, x, y);
        }

        return this._fitQ1(obj, q, qarea, x, y) &&
               this._fitQ2(obj, q, qarea, x, y) &&
               this._fitQ3(obj, q, qarea, x, y) &&
               this._fitQ4(obj, q, qarea, x, y);
    }
}

// Return function that detects and prevent collisions for the specified area
export function addNoCollideFunc(width, height) {
    const quadTree = new SimpleQuadTree(width, height);

    // Returns true if area could be added and false if not (because it collided with other ares)
    return (x, y, w, h) => quadTree.add(x, y, w, h);
}
