/*
    Below, you may find translations used by all (sub)componnets.
    They are further added as properties to the main widget (see its get properties for details).
    They are declared here rather than in get properties to avoid looong list of properties (redability).

    If you find you need some additional translation, please add it to the below object.
*/

export const refDictionary = {
    stringAdd:               'Add',
    stringAddFilter:         'Add Filter',
    stringAddValue:          'Add Value',
    stringAfter:             'after',
    stringAfterEq:           'after or equal to',
    stringAll:               'All',
    stringAnd:               'AND',
    stringApply:             'Apply',
    stringBefore:            'before',
    stringBeforeEq:          'before or equal to',
    stringBetween:           'between',
    stringCancel:            'Cancel',
    stringSelect:            'Select',
    stringContains:          'contains',
    stringDate:              'Date',
    stringDays:              'days',
    stringDoneLabelButton:   'Done',
    stringEndsWith:          'ends with',
    stringEquals:            'equal to',
    stringExact:             'is exactly',
    stringFalse:             'False',
    stringFilter:            'filter',
    stringFilterBy:          'Filter by',
    stringFilters:           'filters',
    stringFrom:              'from',
    stringHideFilters:       'Hide Filters',
    stringHours:             'hours',
    stringHoursCap:          'Hours',
    stringJoinedBy:          ', joined by',
    stringKilometers:        'kilometers',
    stringLatitude:          'Latitude',
    stringLongitude:         'Longitude',
    stringMiles:             'miles',
    stringMinuts:            'minutes',
    stringMinutsCap:         'Minutes',
    stringMonths:            'months',
    stringNauticalMiles:     'nautical miles',
    stringNot:               'is not',
    stringNotContains:       'does not contain',
    stringNotEquals:         'not equal to',
    stringNotEndsWith:       'does not end with',
    stringNotStartsWith:     'does not start with',
    stringNotWithin:         'Not Within',
    stringOr:                'OR',
    stringOutside:           'outside',
    stringPleaseSelectDate:  'Please select date',
    stringSeconds:           'seconds',
    stringSecondsCap:        'Seconds',
    stringSelectFilterFirst: 'Select Filter First',
    stringShowFilters:       'Show Filters',
    stringStartsWith:        'starts with',
    stringTime:              'Time',
    stringStartTime:         'Start Time',
    stringTo:                'to',
    stringToDate:            'To Date',
    stringToday:             'Today',
    stringToTime:            'To Time',
    stringEndTime:           'End Time',
    stringTrue:              'True',
    stringUnits:             'Units',
    stringValue1:            'Value 1',
    stringValue2:            'Value 2',
    stringValue:             'Value',
    stringWeeks:             'weeks',
    stringWithin:            'Within',
    stringWithinLast:        'within the last',
    stringYears:             'years'
};
/* The returned object has the following structure:
{
    stringAddFilter: {
        type: String,
        value: 'Add Filter'
    },
    stringApply: {
        type: String,
        value: 'Apply'
    },
    ...
    ...
}
*/
export function getStringBasedProperties() {
    const stringBasedProperties = {};
    Object.keys(refDictionary).forEach(keyStringProp => {
        stringBasedProperties[keyStringProp] = {
            type:  String,
            value: refDictionary[keyStringProp]
        };
    });
    return stringBasedProperties;
}
