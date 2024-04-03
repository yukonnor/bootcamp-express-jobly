"use strict";

const { ExpressError } = require("../expressError");
const { objectIsValid, convertStringToBool } = require("./validation");

describe("objectIsValid tests", function () {
    const objToTest = {
        name: "test",
        minEmployees: 1,
        maxEmployees: 100,
    };

    const allowedAttr = ["name", "minEmployees", "maxEmployees"];

    test("works", function () {
        const result = objectIsValid(objToTest, allowedAttr);
        expect(result).toBeTruthy;
    });

    test("returns true if object is empty", function () {
        const emptyObj = {};
        const result = objectIsValid(emptyObj, allowedAttr);
        expect(result).toBeTruthy;
    });

    test("returns true if partial attr provided", function () {
        delete objToTest.minEmployees;
        delete objToTest.maxEmployees;

        const result = objectIsValid(objToTest, allowedAttr);
        expect(result).toBeTruthy;
    });

    test("returns false if unapproved attr provided", function () {
        objToTest["new"] = "test";
        const result = objectIsValid(objToTest, allowedAttr);
        expect(result).toBeFalsey;
    });
});

describe("convertStringToBool tests", function () {
    test("works: true", function () {
        const result = convertStringToBool("true");
        expect(result).toBe(true);
    });

    test("works: false", function () {
        const result = convertStringToBool("false");
        expect(result).toBe(false);
    });

    test("throws error if invalid string provided", function () {
        try {
            const result = convertStringToBool("asdfasdf");
        } catch (err) {
            expect(err instanceof ExpressError).toBeTruthy();
        }
    });
});
