"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError, ExpressError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const { objectIsValid } = require("../helpers/validation");

// const companyNewSchema = require("../schemas/companyNew.json");
// const companyUpdateSchema = require("../schemas/companyUpdate.json");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * job should be { companyHandle, title, salary, equity }
 *
 * Returns { id, companyHandle, title, salary, equity }
 *
 * Authorization required: admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map((e) => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** GET /  =>
 *   { jobs: [ { id, companyHandle, title, salary, equity }, ...] }
 *
 * Can filter on provided search filter:
 * - title (string. will find case-insensitive, partial matches)
 * - minSalary (int)
 * - equity (boolean)
 *
 * Filters are optional and are sent in the query string of the request.
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
    try {
        const filters = req.query;

        // if filters not provided, return all jobs
        if (Object.keys(filters).length === 0) {
            const jobs = await Job.findAll();
            return res.json({ jobs });
        }

        // if invalid filters provided, throw error
        if (!objectIsValid(filters, ["title", "minSalary", "hasEquity"])) {
            throw new ExpressError(
                "Please provide one of these attributes to filter companies: 'title', 'minSalary', 'hasEquity'.",
                400
            );
        }

        // if valid filters provided, return a filtered set of jobs
        const jobs = await Job.findSome(filters);
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

/** GET /[id]  =>  { job }
 *
 *   job object is { id, company, title, salary, equity }
 *   where company is { handle, name, description, numEmployees, logoUrl}
 *
 *   Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns job: { id, companyHandle, title, salary, equity }
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map((e) => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: req.params.id });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
