"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    adminToken,
} = require("./_testCommon");

/* Helper function to get the job object of the first test job  */
async function getJob() {
    const jobsResponse = await request(app).get("/jobs");
    const job = jobsResponse.body.jobs[0];

    return job;
}

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        companyHandle: "c1",
        title: "New Title",
        salary: 15000,
        equity: 0.111,
    };

    test("ok for admins", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                companyHandle: "c1",
                title: "New Title",
                salary: 15000,
                equity: "0.111",
            },
        });
    });

    test("fails if not admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("fails if not logged in", async function () {
        const resp = await request(app).post("/jobs").send(newJob).set("authorization", ``);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/companies")
            .send({
                companyHandle: "c3",
                equity: 0.555,
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/companies")
            .send({
                ...newJob,
                equity: 1.111,
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    companyHandle: "c1",
                    title: "T1",
                    salary: 10000,
                    equity: "0.2",
                },
                {
                    id: expect.any(Number),
                    companyHandle: "c1",
                    title: "T2",
                    salary: 20000,
                    equity: "0",
                },
            ],
        });
    });

    test("works: title filter provided", async function () {
        const filters = { title: "t" };
        const resp = await request(app).get("/jobs").query(filters);
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    companyHandle: "c1",
                    title: "T1",
                    salary: 10000,
                    equity: "0.2",
                },
                {
                    id: expect.any(Number),
                    companyHandle: "c1",
                    title: "T2",
                    salary: 20000,
                    equity: "0",
                },
            ],
        });
    });

    test("works: salary filter provided", async function () {
        const filters = { minSalary: 15000 };
        const resp = await request(app).get("/jobs").query(filters);
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    companyHandle: "c1",
                    title: "T2",
                    salary: 20000,
                    equity: "0",
                },
            ],
        });
    });

    test("works: equity true filter provided", async function () {
        const filters = { hasEquity: true };
        const resp = await request(app).get("/jobs").query(filters);
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    companyHandle: "c1",
                    title: "T1",
                    salary: 10000,
                    equity: "0.2",
                },
            ],
        });
    });

    test("works: equity false filter provided", async function () {
        const filters = { hasEquity: false };
        const resp = await request(app).get("/jobs").query(filters);

        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    companyHandle: "c1",
                    title: "T1",
                    salary: 10000,
                    equity: "0.2",
                },
                {
                    id: expect.any(Number),
                    companyHandle: "c1",
                    title: "T2",
                    salary: 20000,
                    equity: "0",
                },
            ],
        });
    });

    test("works: all filters provided", async function () {
        const filters = { title: "t", minSalary: 10001, hasEquity: false };
        const resp = await request(app).get("/jobs").query(filters);

        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    companyHandle: "c1",
                    title: "T2",
                    salary: 20000,
                    equity: "0",
                },
            ],
        });
    });

    test("fails: unsupported equity filter provided", async function () {
        const filters = { equity: 1 };
        const resp = await request(app).get("/jobs").query(filters);
        expect(resp.status).toEqual(400);
    });

    test("fails: unsupported filter provided", async function () {
        const filters = { age: 5 };
        const resp = await request(app).get("/jobs").query(filters);
        expect(resp.status).toEqual(400);
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app).get("/jobs").set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const job = await getJob();
        const id = job.id;

        const resp = await request(app).get(`/jobs/${id}`);
        expect(resp.body).toEqual({
            job: {
                id: job.id,
                title: job.title,
                salary: job.salary,
                equity: job.equity,
                company: {
                    handle: expect.any(String),
                    name: expect.any(String),
                    numEmployees: expect.any(Number),
                },
            },
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for admins", async function () {
        const job = await getJob();
        const id = job.id;

        const resp = await request(app)
            .patch(`/jobs/${id}`)
            .send({
                title: "T1-new",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                ...job,
                title: "T1-new",
            },
        });
    });

    test("unauth error for regular users", async function () {
        const job = await getJob();
        const id = job.id;

        const resp = await request(app)
            .patch(`/jobs/${id}`)
            .send({
                title: "T1-new",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth error for anon", async function () {
        const job = await getJob();
        const id = job.id;

        const resp = await request(app).patch(`/jobs/${id}`).send({
            title: "T1-new",
        });
        expect(resp.statusCode).toEqual(401);
    });

    test("not found error on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: "new nope",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request error on companyHandle change attempt", async function () {
        const job = await getJob();
        const id = job.id;

        const resp = await request(app)
            .patch(`/jobs/${id}`)
            .send({
                companyHandle: "c2",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
        const job = await getJob();
        const id = job.id;

        const resp = await request(app)
            .patch(`/jobs/${id}`)
            .send({
                salary: "too stringy",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("works for users", async function () {
        const job = await getJob();
        const id = job.id;

        const resp = await request(app)
            .delete(`/jobs/${id}`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: id });
    });

    test("fails for regular users", async function () {
        const job = await getJob();
        const id = job.id;

        const resp = await request(app)
            .delete(`/jobs/${id}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const job = await getJob();
        const id = job.id;

        const resp = await request(app).delete(`/jobs/${id}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such company", async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});
