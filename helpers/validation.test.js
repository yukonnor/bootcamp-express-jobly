"use strict";

const { objectIsValid } = require("./validation");

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
