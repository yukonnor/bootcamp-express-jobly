"use strict";

const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForVariableWhere } = require("./sql");

describe("sqlForPartialUpdate tests", function () {
    const dataToUpdate = {
        name: "NewCo",
        description: "New Description",
        numEmployees: 100,
    };

    const jsToSql = {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
    };

    test("works", function () {
        const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(setCols).toEqual('"name"=$1, "description"=$2, "num_employees"=$3');
        expect(values).toEqual(["NewCo", "New Description", 100]);
    });

    test("throws BadRequestError", function () {
        const noData = [];
        try {
            const { setCols, values } = sqlForPartialUpdate(noData, jsToSql);
            // If no error is thrown, fail the test
            expect(true).toBe(false);
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("throws TypeError if no jsToSql provided", function () {
        try {
            const { setCols, values } = sqlForPartialUpdate(dataToUpdate);
            // If no error is thrown, fail the test
            expect(true).toBe(false);
        } catch (err) {
            expect(err instanceof TypeError).toBeTruthy();
        }
    });

    test("returns bad Sql if bad jsToSql provided", function () {
        const badJsToSql = {
            logoUrl: "logo_url",
        };

        const { setCols, values } = sqlForPartialUpdate(dataToUpdate, badJsToSql);
        expect(setCols).toContain("numEmployees");
    });
});

describe("sqlForVariableWhere tests", function () {
    test("works for company filters", function () {
        const dataToFilter = {
            name: "NewCo",
            minEmployees: 10,
            maxEmployees: 100,
        };

        const result = sqlForVariableWhere(dataToFilter);
        expect(result).toEqual(
            `"name" ILIKE '%NewCo%' AND "num_employees" >= 10 AND "num_employees" <= 100`
        );
    });

    test("works for job filters", function () {
        const dataToFilter = {
            title: "manager",
            minSalary: 50000,
            hasEquity: false,
        };

        const result = sqlForVariableWhere(dataToFilter);
        expect(result).toEqual(`"title" ILIKE '%manager%' AND "salary" >= 50000 AND "equity" >= 0`);
    });

    test("throws BadRequestError if no filters", function () {
        const noFilters = {};
        try {
            const result = sqlForVariableWhere(noFilters);
            // If no error is thrown, fail the test
            expect(true).toBe(false);
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("throws BadRequestError if unsupported filters", function () {
        const badFilters = { numEmployees: 100 };
        try {
            const result = sqlForVariableWhere(badFilters);
            // If no error is thrown, fail the test
            expect(true).toBe(false);
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
            expect(err.message).toBe("Unsupported filter");
        }
    });
});
