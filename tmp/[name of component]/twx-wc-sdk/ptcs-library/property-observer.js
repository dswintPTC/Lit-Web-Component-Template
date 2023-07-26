// Observers propery assignments on object property
/*
Use as:

    observer = new PropertyObserver(
        object,            // Observed object
        propertyName,      // Property Name
        setObserver,       // Observer callback when property value is updated
        getObserver);      // Optional observer if get events should be monitored too

Any changes to object[propertyName] will be reported to:

function observer(value [, oldValue, propertyName, propertyObserver]);
   where this === object


Cancel the observer:

  observer.cancel();

A canceled observer disconnects from the observed object. It should be
called if the observed object lives longer than the observer

*/


export const PropertyObserver = class extends Object {
    constructor(obj, prop, cb, cbGet) {
        super();

        function _descriptor() {
            for (let _obj = obj; _obj; _obj = Object.getPrototypeOf(_obj)) {
                const descriptor = Object.getOwnPropertyDescriptor(_obj, prop);
                if (descriptor) {
                    return descriptor;
                }
            }
            return undefined;
        }

        const descriptor = _descriptor() || {value: obj[prop], writable: true, enumerable: true, configurable: true};

        // Client don't want to observe get
        function getFunc() {
            return descriptor.get ? descriptor.get.call(this) : descriptor.value;
        }

        // Client wants to observe get events
        function getFunc2() {
            const value = descriptor.get ? descriptor.get.call(this) : descriptor.value;
            cbGet.call(obj, value, prop, this);
            return value;
        }

        Object.defineProperty(obj, prop, {
            get: cbGet ? getFunc2 : getFunc,

            set: function(value) {
                const old = descriptor.get ? descriptor.get.call(this) : descriptor.value;
                if (old !== value) {
                    if (descriptor.set) {
                        descriptor.set.call(this, value);
                    } else {
                        descriptor.value = value;
                    }
                    cb.call(obj, value, old, prop, this);
                }
                return value;
            },

            configurable: true,
            enumerable:   descriptor.enumerable
        });

        this.cancel = () => {
            this.cancel = undefined; // Function can only be called once
            Object.defineProperty(obj, prop, descriptor);
        };
    }
};
