# ptcs-popup-controller

## Overview

ptcs-popup-controller is a hidden component that opens a popup window with provided URL and waiting for the "result" message from it.


## Usage Examples

### Basic Usage

~~~html
 <ptcs-popup-controller url="<YOUR_URL>"></ptcs-popup-controller>
~~~

## Component API

### Properties
| Property                 | Type    | Description                                                                 | Default | Triggers a changed event?             |
| ------------------------ | ------- | --------------------------------------------------------------------------- | ------- | ------------------------------------- |
| url                      | String  | Url to be opened in the popup                                               |         | No                                    |
| messageValidation        | Boolean | Deprecated. Additional level of security. Response from the URL should be validated using randomly generated string.| true |No|
| disableResultValidation  | Boolean | Prevents the popup controller from validating that the popup result has a result and a status field format.| false |No        |
| disableMessageValidation | Boolean | Don't validate response from the URL using randomly generated string.       | false   | No                                    |
| popupWidth               | Number  | Width of the popup                                                          | 900     | No                                    |
| popupHeight              | Number  | Height of the popup                                                         | 600     | No                                    |
| popupState               | String  | Readonly. initial/open/canceled/done/blocked                                | initial | No                                    |
| result                   | String  | Readonly. URL result.                                                       |         | No                                    |
| modal                    | Boolean | Deprecated. Should popup be modal?                                          | true    | No                                    |
| nonModal                 | Boolean | Should popup be non-modal?                                                  | false   | No                                    |
| showPopupBlockedMessage  | Boolean | Enables you to display an alert message when the popup window is blocked by the browser? | false |No                          |
| popupBlockedMessage      | String  | Message to display when the popup window is blocked.                        |         |No                                     |
| method                   | String  | Request method type for opening pop-up. "GET"/"POST".                       | "GET"   |No                                     |
| params                   | Object  | JS object which specifies the parameters that will be sent with the request.| { }     |No                                     |

### Events

| Name           | Description                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------- |
| popup-done     | Triggered when URL returned a result successfully. You can get the result from ```detail.result``` |
| popup-canceled | Triggered when URL failed or the popup was closed manually.                                        |
| popup-blocked  | Triggered when popup is not allowed by the browser.                                                |


### Methods

| Signature | Description                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------------- |
| open      | Open popup window with the provided url. Returns a promise that is either resolved with the token value or rejected. |
