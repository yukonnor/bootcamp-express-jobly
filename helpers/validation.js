const { BadRequestError } = require("../expressError");

/** returns true or false based on whether the the object only contains keys that are defined in the allowedAttr list.
 *  obj: An object with key/value pairs.
 *  allowedAttr: An array of strings noting the keys that are allowed in the object
 *
 *  returns true if only the allowed attribitutes are in the object.
 */

function objectIsValid(obj, allowedAttr) {
    return Object.keys(obj).every((key) => allowedAttr.includes(key));
}

module.exports = { objectIsValid };
