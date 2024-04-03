"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForVariableWhere } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
    /** Create a job (from data), update db, return new job data.
     *
     * data should be { companyHandle, title, salary, equity }
     *
     * Returns { id, companyHandle, title, salary, equity }
     *
     * */

    static async create({ companyHandle, title, salary, equity }) {
        const handleCheck = await db.query(
            `SELECT handle
           FROM companies
           WHERE handle = $1`,
            [companyHandle]
        );

        if (!handleCheck.rows[0])
            throw new BadRequestError(`Company handle doesn't exist: ${companyHandle}`);

        // TODO: make salary and equity optional to create job.
        const result = await db.query(
            `INSERT INTO jobs
           (company_handle, title, salary, equity)
           VALUES ($1, $2, $3, $4)
           RETURNING id, company_handle as "companyHandle", title, salary, equity`,
            [companyHandle, title, salary, equity]
        );
        const job = result.rows[0];

        return job;
    }

    /** Find all jobs.
     *
     * Returns [{ id, companyHandle, title, salary, equity }, ...]
     * */

    static async findAll() {
        const jobsResults = await db.query(
            `SELECT id,
                    company_handle as "companyHandle",
                    title,
                    salary,
                    equity
           FROM jobs
           ORDER BY id`
        );
        return jobsResults.rows;
    }

    /** Find some jobs based on provided filters
     *
     * filters obj should include { title, minSalary, hasEquity }
     * Note: the route validates that the filter object contains at least one filter and only includes the allowed filter attrs.
     *
     * Returns a list of jobs: [{ id, companyHandle, title, salary, equity }, ...]
     * */

    static async findSome(filters) {
        // generate a where statement based on the filters provided
        const whereStatement = sqlForVariableWhere(filters);

        const jobsResults = await db.query(
            `SELECT id,
                    company_handle as "companyHandle",
                    title,
                    salary,
                    equity
           FROM jobs
           ${whereStatement}
           ORDER BY id`
        );

        return jobsResults.rows;
    }

    /** Given a job id, return data about job.
     *
     * Returns { id, title, salary, equity, company }
     *   where company is { handle, name, description, numEmployees }
     *
     * Throws NotFoundError if not found.
     **/

    static async get(id) {
        const jobResults = await db.query(
            `SELECT j.id, 
                    j.title, 
                    j.salary, 
                    j.equity, 
                    json_build_object(
                     'handle', c.handle,
                     'name', c.name,
                     'numEmployees', c.num_employees) AS company
             FROM jobs AS j
             JOIN companies AS c ON (j.company_handle = c.handle)
             WHERE j.id = $1`,
            [id]
        );

        const job = jobResults.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Update job data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: { title, salary, equity }
     *
     * Returns { id, companyHandle, title, salary, equity }
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data, {});
        const handleVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, 
                                company_handle AS "companyHandle", 
                                title, 
                                salary, 
                                equity`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        console.log("job from model:", job);

        if (!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    }

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
            [id]
        );
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;
