// See compile-parts.md for information about how to generate this file

export const mapPart = (() => {
    const partMap = {
        'ptcs-breadcrumb': {
            leftbutton: {
                name:    'ptcs-button',
                variant: 'small'
            },
            link: {
                name:    'ptcs-link',
                variant: 'secondary'
            },
            rightbutton: {
                name:    'ptcs-button',
                variant: 'small'
            },
            dropdown: {
                name: 'ptcs-dropdown'
            }
        },
        'ptcs-button': {
            icon: {
                name: 'ptcs-icon'
            },
            label: {
                name:    'ptcs-label',
                variant: 'label'
            }
        },
        'ptcs-chart-axis': {
            label: {
                name:    'ptcs-label',
                variant: 'label'
            },
            'tick-label': {
                name:    'ptcs-label',
                variant: 'tick'
            }
        },
        'ptcs-chart-core-line': {
            value: {
                name:    'ptcs-label',
                variant: 'label'
            }
        },
        'ptcs-chart-zoom': {
            label: {
                name:    'ptcs-label',
                variant: 'label'
            },
            'select-duration-length': {
                name: 'ptcs-dropdown'
            },
            'select-duration-unit': {
                name: 'ptcs-dropdown'
            },
            'pick-zoom': {
                name: 'ptcs-datepicker'
            },
            slider: {
                name: 'ptcs-slider'
            },
            'zoom-axis': {
                name: 'ptcs-chart-axis'
            }
        },
        'ptcs-checkbox': {
            label: {
                name:    'ptcs-label',
                variant: 'label'
            }
        },
        'ptcs-confirmation': {
            overlay: {
                name: 'ptcs-modal-overlay'
            },
            title: {
                name:    'ptcs-label',
                variant: 'header'
            },
            message: {
                name:    'ptcs-label',
                variant: 'body'
            },
            'primary-button': {
                name:    'ptcs-button',
                variant: 'primary'
            },
            'secondary-button': {
                name:    'ptcs-button',
                variant: 'secondary'
            },
            'cancel-button': {
                name:    'ptcs-button',
                variant: 'secondary'
            },
            'close-button': {
                name:    'ptcs-button',
                variant: 'small'
            }
        },
        'ptcs-datepicker': {
            label: {
                name:    'ptcs-label',
                variant: 'label'
            },
            'date-field': {
                name: 'ptcs-textfield'
            },
            calendar: {
                name: 'ptcs-datepicker-calendar'
            }
        },
        'ptcs-datepicker-calendar': {
            'prev-month-button': {
                name:    'ptcs-button',
                variant: 'small'
            },
            'month-dropdown': {
                name: 'ptcs-dropdown'
            },
            'year-dropdown': {
                name: 'ptcs-dropdown'
            },
            'next-month-button': {
                name:    'ptcs-button',
                variant: 'small'
            },
            'hour-dropdown': {
                name: 'ptcs-dropdown'
            },
            'minute-dropdown': {
                name: 'ptcs-dropdown'
            },
            'second-dropdown': {
                name: 'ptcs-dropdown'
            },
            'apply-button': {
                name:    'ptcs-button',
                variant: 'primary'
            },
            'today-button': {
                name:    'ptcs-button',
                variant: 'tertiary'
            }
        },
        'ptcs-dropdown': {
            label: {
                name:    'ptcs-label',
                variant: 'label'
            },
            'item-value': {
                name:    'ptcs-label',
                variant: 'label'
            },
            icon: {
                name: 'ptcs-icon'
            },
            filter: {
                name: 'ptcs-textfield'
            },
            link: {
                name:    'ptcs-link',
                variant: 'secondary'
            },
            list: {
                name: 'ptcs-list'
            }
        },
        'ptcs-image': {
            'alt-label': {
                name: 'ptcs-label'
            }
        },
        'ptcs-list': {
            label: {
                name:    'ptcs-label',
                variant: 'label'
            },
            'filter-field': {
                name: 'ptcs-textfield'
            },
            link: {
                name:    'ptcs-link',
                variant: 'secondary'
            },
            'item-value': {
                name:    'ptcs-label',
                variant: 'label'
            },
            'item-meta': {
                name:    'ptcs-label',
                variant: 'label'
            },
            'item-checkbox': {
                name: 'ptcs-checkbox'
            }
        },
        'ptcs-list-shuttle': {
            label: {
                name: 'ptcs-label'
            },
            'source-list': {
                name: 'ptcs-list'
            },
            'add-button': {
                name:    'ptcs-button',
                variant: 'tertiary'
            },
            'target-list': {
                name: 'ptcs-list'
            },
            button: {
                name:    'ptcs-button',
                variant: 'tertiary'
            },
            'remove-button': {
                name:    'ptcs-button',
                variant: 'tertiary'
            },
            'up-button': {
                name:    'ptcs-button',
                variant: 'tertiary'
            },
            'down-button': {
                name:    'ptcs-button',
                variant: 'tertiary'
            }
        },
        'ptcs-modal-image-popup': {
            'disclosure-button': {
                name:    'ptcs-button',
                variant: 'small'
            },
            'popup-close-button': {
                name:    'ptcs-button',
                variant: 'small'
            }
        },
        'ptcs-property-display': {
            'property-display-label': {
                name: 'ptcs-label'
            },
            'text-if-no-value': {
                name: 'ptcs-label'
            },
            'property-group-label': {
                name: 'ptcs-label'
            },
            'value-display-item': {
                name: 'ptcs-value-display'
            }
        },
        'ptcs-radio': {
            label: {
                name:    'ptcs-label',
                variant: 'label'
            }
        },
        'ptcs-slider': {
            'icon-min': {
                name: 'ptcs-icon'
            },
            'icon-max': {
                name: 'ptcs-icon'
            },
            'min-label': {
                name:    'ptcs-label',
                variant: 'label'
            },
            'max-label': {
                name:    'ptcs-label',
                variant: 'label'
            },
            label: {
                name: 'ptcs-label'
            },
            'min-max-label': {
                name:    'ptcs-label',
                variant: 'label'
            },
            thumb: {
                name: 'ptcs-icon'
            },
            thumb1: {
                name: 'ptcs-icon'
            },
            thumb2: {
                name: 'ptcs-icon'
            }
        },
        'ptcs-tab-set': {
            'tabs-header': {
                name: 'ptcs-tabs'
            },
            'tabs-tab-label': {
                name:    'ptcs-label',
                variant: 'label'
            }
        },
        'ptcs-tabs': {
            'back-ptcsbutton': {
                name:    'ptcs-button',
                variant: 'small'
            },
            'forward-ptcsbutton': {
                name:    'ptcs-button',
                variant: 'small'
            },
            'tabs-list': {
                name: 'ptcs-dropdown'
            }
        },
        'ptcs-tabset': {
            'tabs-back-ptcsbutton': {
                name:    'ptcs-button',
                variant: 'small'
            },
            'tabs-forward-ptcsbutton': {
                name:    'ptcs-button',
                variant: 'small'
            },
            'tabs-tabs-list': {
                name: 'ptcs-dropdown'
            },
            'tabs-tab-icon': {
                name: 'ptcs-icon'
            },
            'tabs-tab-label': {
                name:    'ptcs-label',
                variant: 'label'
            }
        },
        'ptcs-textarea': {
            label: {
                name:    'ptcs-label',
                variant: 'label'
            }
        },
        'ptcs-textfield': {
            label: {
                name:    'ptcs-label',
                variant: 'label'
            },
            icon: {
                name: 'ptcs-icon'
            },
            'clear-button': {
                name:    'ptcs-button',
                variant: 'small'
            }
        },
        'ptcs-toggle-button': {
            label: {
                name:    'ptcs-label',
                variant: 'label'
            }
        },
        'ptcs-togglebutton': {
            label: {
                name:    'ptcs-label',
                variant: 'label'
            }
        },
        'ptcs-tooltip-overlay': {
            'tooltip-icon': {
                name: 'ptcs-icon'
            }
        },
        'ptcs-value-display': {
            'value-display-label': {
                name: 'ptcs-label'
            },
            'disclosure-button': {
                name:    'ptcs-button',
                variant: 'small'
            }
        }
    };

    return (wc, part) => {
        const a = partMap[wc];
        return a ? a[part] : undefined;
    };
})();
