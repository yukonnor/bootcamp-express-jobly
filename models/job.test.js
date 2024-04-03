"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

/* Helper function to get id of first test job */
async function getJobId(companyHandle) {
    const idResult = await db.query(
        `SELECT id
         FROM jobs
         WHERE company_handle = $1`,
        [companyHandle]
    );

    return idResult.rows[0].id;
}

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = { companyHandle: "c1", title: "Title", salary: 50000, equity: 0.111 };

    test("works", async function () {
        let job = await Job.create(newJob);

        // add id property to newJob
        newJob["id"] = job.id;

        expect(job).toEqual({
            id: expect.any(Number),
            companyHandle: "c1",
            title: "Title",
            salary: 50000,
            equity: "0.111",
        });

        const result = await db.query(
            `SELECT id, company_handle as "companyHandle", title, salary, equity
             FROM jobs
             WHERE id = $1`,
            [job.id]
        );
        expect(result.rows).toEqual([
            {
                id: expect.any(Number),
                companyHandle: "c1",
                title: "Title",
                salary: 50000,
                equity: "0.111",
            },
        ]);
    });

    test("bad request with bad company handle", async function () {
        try {
            const badJob = { companyHandle: "asdf", title: "Title", salary: 50000, equity: 0.111 };
            await Job.create(badJob);
            // If no error is thrown, fail the test
            expect(false).toBeTruthy();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                companyHandle: "c1",
                title: "T1",
                salary: 10000,
                equity: "0.2",
            },
            {
                id: expect.any(Number),
                companyHandle: "c2",
                title: "T2",
                salary: 20000,
                equity: "0",
            },
        ]);
    });
});

/************************************** findSome */

describe("findSome", function () {
    test("works: title filter provided", async function () {
        const filters = { title: "t" };
        let jobs = await Job.findSome(filters);
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                companyHandle: "c1",
                title: "T1",
                salary: 10000,
                equity: "0.2",
            },
            {
                id: expect.any(Number),
                companyHandle: "c2",
                title: "T2",
                salary: 20000,
                equity: "0",
            },
        ]);
    });

    test("works: salary and equity filters provided", async function () {
        const filters = { minSalary: 15000, hasEquity: false };
        let jobs = await Job.findSome(filters);
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                companyHandle: "c2",
                title: "T2",
                salary: 20000,
                equity: "0",
            },
        ]);
    });

    test("works: empty filter obj", async function () {
        const filters = {};
        let jobs = await Job.findSome(filters);
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                companyHandle: "c1",
                title: "T1",
                salary: 10000,
                equity: "0.2",
            },
            {
                id: expect.any(Number),
                companyHandle: "c2",
                title: "T2",
                salary: 20000,
                equity: "0",
            },
        ]);
    });

    test("works: no filter provided", async function () {
        let jobs = await Job.findSome();
        expect(jobs).toEqual([
            {
                id: expect.any(Number),
                companyHandle: "c1",
                title: "T1",
                salary: 10000,
                equity: "0.2",
            },
            {
                id: expect.any(Number),
                companyHandle: "c2",
                title: "T2",
                salary: 20000,
                equity: "0",
            },
        ]);
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        const idResult = await db.query(
            `SELECT id
             FROM jobs
             WHERE company_handle = $1`,
            ["c1"]
        );

        const id = idResult.rows[0].id;
        let job = await Job.get(id);

        expect(job).toEqual({
            id: id,
            company: {
                handle: "c1",
                name: "C1",
                numEmployees: 1,
            },
            title: "T1",
            salary: 10000,
            equity: "0.2",
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.get(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = { title: "New Title", salary: 30000, equity: 0.25 };

    test("works", async function () {
        const id = await getJobId("c1");
        let job = await Job.update(id, updateData);

        console.log("job from test:", job);

        expect(job).toEqual({
            id: id,
            companyHandle: "c1",
            title: "New Title",
            salary: 30000,
            equity: "0.25",
        });

        const result = await db.query(
            `SELECT id, company_handle as "companyHandle", title, salary, equity
             FROM jobs
             WHERE id = $1`,
            [id]
        );
        expect(result.rows).toEqual([
            {
                id: id,
                companyHandle: "c1",
                title: "New Title",
                salary: 30000,
                equity: "0.25",
            },
        ]);
    });

    test("works: null fields", async function () {
        const id = await getJobId("c1");
        const updateDataSetNulls = { title: "New Title", salary: null, equity: null };

        let job = await Job.update(id, updateDataSetNulls);
        expect(job).toEqual({
            id: id,
            companyHandle: "c1",
            ...updateDataSetNulls,
        });

        const result = await db.query(
            `SELECT id, company_handle, title, salary, equity
             FROM jobs
             WHERE id = $1`,
            [id]
        );
        expect(result.rows).toEqual([
            {
                id: id,
                company_handle: "c1",
                ...updateDataSetNulls,
            },
        ]);
    });

    test("not found if no such job", async function () {
        try {
            await Job.update(0, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function () {
        try {
            await Job.update("c1", {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        const id = await getJobId("c1");
        await Job.remove(id);
        const res = await db.query("SELECT id FROM jobs WHERE id=$1", [id]);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
