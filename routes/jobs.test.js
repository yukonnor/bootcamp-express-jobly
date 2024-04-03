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
    // test("ok for anon", async function () {
    //     const resp = await request(app).get("/jobs");
    //     expect(resp.body).toEqual({
    //         jobs: [
    //             {
    //                 id: expect.any(Number),
    //                 companyHandle: "c1",
    //                 title: "T1",
    //                 salary: 10000,
    //                 equity: "0.2",
    //             },
    //             {
    //                 id: expect.any(Number),
    //                 companyHandle: "c2",
    //                 title: "T2",
    //                 salary: 20000,
    //                 equity: "0",
    //             },
    //         ],
    //     });
    // });

    // test("works: title filter provided", async function () {
    //     const filters = { title: "t" };
    //     const resp = await request(app).get("/jobs").query(filters);
    //     expect(resp.body).toEqual({
    //         jobs: [
    //             {
    //                 id: expect.any(Number),
    //                 companyHandle: "c1",
    //                 title: "T1",
    //                 salary: 10000,
    //                 equity: "0.2",
    //             },
    //             {
    //                 id: expect.any(Number),
    //                 companyHandle: "c2",
    //                 title: "T2",
    //                 salary: 20000,
    //                 equity: "0",
    //             },
    //         ],
    //     });
    // });

    // test("works: salary filter provided", async function () {
    //     const filters = { minSalary: 15000 };
    //     const resp = await request(app).get("/jobs").query(filters);
    //     expect(resp.body).toEqual({
    //         jobs: [
    //             {
    //                 id: expect.any(Number),
    //                 companyHandle: "c2",
    //                 title: "T2",
    //                 salary: 20000,
    //                 equity: "0",
    //             },
    //         ],
    //     });
    // });

    // test("works: equity filter provided", async function () {
    //     const filters = { hasEquity: true };
    //     const resp = await request(app).get("/jobs").query(filters);
    //     expect(resp.body).toEqual({
    //         jobs: [
    //             {
    //                 id: expect.any(Number),
    //                 companyHandle: "c1",
    //                 title: "T1",
    //                 salary: 10000,
    //                 equity: "0.2",
    //             },
    //         ],
    //     });
    // });

    test("works: equity filter provided 2", async function () {
        const filters = { hasEquity: false };
        const resp = await request(app).get("/jobs").query(filters);

        console.log("equity resp.body", resp.body);

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
                    companyHandle: "c2",
                    title: "T2",
                    salary: 20000,
                    equity: "0",
                },
            ],
        });
    });

    // test("works: all filters provided", async function () {
    //     const filters = { title: "t", minSalary: 10001, hasEquity: false };
    //     const resp = await request(app).get("/jobs").query(filters);

    //     console.log("all resp.body", resp.body);

    //     expect(resp.body).toEqual({
    //         jobs: [
    //             {
    //                 id: expect.any(Number),
    //                 companyHandle: "c2",
    //                 title: "T2",
    //                 salary: 20000,
    //                 equity: "0",
    //             },
    //         ],
    //     });
    // });

    // test("fails: unsupported filter provided", async function () {
    //     const filters = { age: 5 };
    //     const resp = await request(app).get("/jobs").query(filters);
    //     expect(resp.status).toEqual(400);
    // });

    // test("fails: test next() handler", async function () {
    //     // there's no normal failure event which will cause this route to fail ---
    //     // thus making it hard to test that the error-handler works with it. This
    //     // should cause an error, all right :)
    //     await db.query("DROP TABLE jobs CASCADE");
    //     const resp = await request(app).get("/jobs").set("authorization", `Bearer ${u1Token}`);
    //     expect(resp.statusCode).toEqual(500);
    // });
});

/************************************** GET /companies/:handle */

// describe("GET /companies/:handle", function () {
//     test("works for anon", async function () {
//         const resp = await request(app).get(`/companies/c1`);
//         expect(resp.body).toEqual({
//             company: {
//                 handle: "c1",
//                 name: "C1",
//                 description: "Desc1",
//                 numEmployees: 1,
//                 logoUrl: "http://c1.img",
//             },
//         });
//     });

//     test("works for anon: company w/o jobs", async function () {
//         const resp = await request(app).get(`/companies/c2`);
//         expect(resp.body).toEqual({
//             company: {
//                 handle: "c2",
//                 name: "C2",
//                 description: "Desc2",
//                 numEmployees: 2,
//                 logoUrl: "http://c2.img",
//             },
//         });
//     });

//     test("not found for no such company", async function () {
//         const resp = await request(app).get(`/companies/nope`);
//         expect(resp.statusCode).toEqual(404);
//     });
// });

/************************************** PATCH /companies/:handle */

// describe("PATCH /companies/:handle", function () {
//     test("works for admins", async function () {
//         const resp = await request(app)
//             .patch(`/companies/c1`)
//             .send({
//                 name: "C1-new",
//             })
//             .set("authorization", `Bearer ${adminToken}`);
//         expect(resp.body).toEqual({
//             company: {
//                 handle: "c1",
//                 name: "C1-new",
//                 description: "Desc1",
//                 numEmployees: 1,
//                 logoUrl: "http://c1.img",
//             },
//         });
//     });

//     test("fails for regular users", async function () {
//         const resp = await request(app)
//             .patch(`/companies/c1`)
//             .send({
//                 name: "C1-new",
//             })
//             .set("authorization", `Bearer ${u1Token}`);
//         expect(resp.statusCode).toEqual(401);
//     });

//     test("unauth for anon", async function () {
//         const resp = await request(app).patch(`/companies/c1`).send({
//             name: "C1-new",
//         });
//         expect(resp.statusCode).toEqual(401);
//     });

//     test("not found on no such company", async function () {
//         const resp = await request(app)
//             .patch(`/companies/nope`)
//             .send({
//                 name: "new nope",
//             })
//             .set("authorization", `Bearer ${adminToken}`);
//         expect(resp.statusCode).toEqual(404);
//     });

//     test("bad request on handle change attempt", async function () {
//         const resp = await request(app)
//             .patch(`/companies/c1`)
//             .send({
//                 handle: "c1-new",
//             })
//             .set("authorization", `Bearer ${adminToken}`);
//         expect(resp.statusCode).toEqual(400);
//     });

//     test("bad request on invalid data", async function () {
//         const resp = await request(app)
//             .patch(`/companies/c1`)
//             .send({
//                 logoUrl: "not-a-url",
//             })
//             .set("authorization", `Bearer ${adminToken}`);
//         expect(resp.statusCode).toEqual(400);
//     });
// });

/************************************** DELETE /companies/:handle */

// describe("DELETE /companies/:handle", function () {
//     test("works for users", async function () {
//         const resp = await request(app)
//             .delete(`/companies/c1`)
//             .set("authorization", `Bearer ${adminToken}`);
//         expect(resp.body).toEqual({ deleted: "c1" });
//     });

//     test("failes for regular users", async function () {
//         const resp = await request(app)
//             .delete(`/companies/c1`)
//             .set("authorization", `Bearer ${u1Token}`);
//         expect(resp.statusCode).toEqual(401);
//     });

//     test("unauth for anon", async function () {
//         const resp = await request(app).delete(`/companies/c1`);
//         expect(resp.statusCode).toEqual(401);
//     });

//     test("not found for no such company", async function () {
//         const resp = await request(app)
//             .delete(`/companies/nope`)
//             .set("authorization", `Bearer ${adminToken}`);
//         expect(resp.statusCode).toEqual(404);
//     });
// });
