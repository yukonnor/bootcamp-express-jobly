const { BadRequestError, ExpressError } = require("../expressError");

/** objectIsValid() returns true or false based on whether the the object only contains keys that are defined in the allowedAttr list.
 *  obj: An object with key/value pairs.
 *  allowedAttr: An array of strings noting the keys that are allowed in the object
 *
 *  returns true if only the allowed attribitutes are in the object.
 */

function objectIsValid(obj, allowedAttr) {
    return Object.keys(obj).every((key) => allowedAttr.includes(key));
}

/** convertStringToBool() returns a boolean datatype (true or false) based
 *  on the provided string.
 *
 *  "true" returns true
 *  "false" returns false
 *   All other strings / arguments will throw an ExppressErr error.
 */

function convertStringToBool(string) {
    let value;
    if (string === "true") {
        value = true;
    } else if (string === "false") {
        value = false;
    } else {
        // If the string doesn't represent a valid boolean value, handle it accordingly
        throw new ExpressError(
            "Please provide either 'true' or 'false' for the 'hasEquity' filter.",
            400
        );
    }
    return value;
}

module.exports = { objectIsValid, convertStringToBool };
