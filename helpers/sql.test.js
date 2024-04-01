"use strict";

const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

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
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("throws TypeError if no jsToSql provided", function () {
        try {
            const { setCols, values } = sqlForPartialUpdate(dataToUpdate);
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
