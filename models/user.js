"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
    ExpressError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class User {
    /** authenticate user with username, password.
     *
     * Returns { username, first_name, last_name, email, is_admin }
     *
     * Throws UnauthorizedError is user not found or wrong password.
     **/

    static async authenticate(username, password) {
        // try to find the user first
        const result = await db.query(
            `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
            [username]
        );

        const user = result.rows[0];

        if (user) {
            // compare hashed password to a new hash from password
            const isValid = await bcrypt.compare(password, user.password);
            if (isValid === true) {
                delete user.password;
                return user;
            }
        }

        throw new UnauthorizedError("Invalid username/password");
    }

    /** Register user with data.
     *
     * Returns { username, firstName, lastName, email, isAdmin }
     *
     * Throws BadRequestError on duplicates.
     **/

    static async register({ username, password, firstName, lastName, email, isAdmin }) {
        const duplicateCheck = await db.query(
            `SELECT username
           FROM users
           WHERE username = $1`,
            [username]
        );

        if (duplicateCheck.rows[0]) {
            throw new BadRequestError(`Duplicate username: ${username}`);
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

        const result = await db.query(
            `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email,
            is_admin)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
            [
                username,
                hashedPassword,
                firstName,
                lastName,
                email,
                isAdmin !== undefined ? isAdmin : false,
            ]
        );

        const user = result.rows[0];

        return user;
    }

    /** Find all users.
     *
     * Returns [{ username, first_name, last_name, email, is_admin, jobs }, ...]
     * Where jobs is a list of all jobs the user hass applied to: jobs: [ jobId, jobId, ... ]
     *
     **/

    static async findAll() {
        const result = await db.query(
            `SELECT u.username,
                    u.first_name AS "firstName",
                    u.last_name AS "lastName",
                    u.email,
                    u.is_admin AS "isAdmin",
                    CASE 
                        WHEN jsonb_agg(a.job_id) = '[null]' THEN '[]' 
                        ELSE jsonb_agg(a.job_id) 
                    END AS jobs
            FROM users u
            LEFT JOIN applications a ON u.username = a.username
            GROUP BY 1,2,3,4,5
            ORDER BY username`
        );

        return result.rows;
    }

    /** Given a username, return data about user.
     *
     * Returns { username, first_name, last_name, is_admin, jobs }
     * Where jobs is a list of all jobs the user hass applied to: jobs: [ jobId, jobId, ... ]
     *
     * Throws NotFoundError if user not found.
     **/

    static async get(username) {
        const userRes = await db.query(
            `SELECT u.username,
                    u.first_name AS "firstName",
                    u.last_name AS "lastName",
                    u.email,
                    u.is_admin AS "isAdmin",
                    CASE 
                        WHEN jsonb_agg(a.job_id) = '[null]' THEN '[]' 
                        ELSE jsonb_agg(a.job_id) 
                    END AS jobs
            FROM users u
            LEFT JOIN applications a ON u.username = a.username
            WHERE u.username = $1
            GROUP BY 1,2,3,4,5
            ORDER BY username`,
            [username]
        );

        const user = userRes.rows[0];

        if (!user) throw new NotFoundError(`No user: ${username}`);

        return user;
    }

    /** Update user data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain
     * all the fields; this only changes provided ones.
     *
     * Data can include:
     *   { firstName, lastName, password, email, isAdmin }
     *
     * Returns { username, firstName, lastName, email, isAdmin }
     *
     * Throws NotFoundError if not found.
     *
     * WARNING: this function can set a new password. Callers of this function
     * must be certain they have validated inputs to this or a serious security
     * risks are opened.
     *
     * NOTE: this route that *currently* calls this method does not allow updates
     * to isAdmin. To handle in future, create a admin-only route that supports
     * making using admins / removing admin status and call this method.
     */

    static async update(username, data) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
        }

        const { setCols, values } = sqlForPartialUpdate(data, {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
        });
        const usernameVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
                                is_admin AS "isAdmin"`;
        const result = await db.query(querySql, [...values, username]);
        const user = result.rows[0];

        if (!user) throw new NotFoundError(`No user: ${username}`);

        delete user.password;
        return user;
    }

    /** Delete given user from database; returns undefined. */

    static async remove(username) {
        let result = await db.query(
            `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
            [username]
        );
        const user = result.rows[0];

        if (!user) throw new NotFoundError(`No user: ${username}`);
    }

    /** Given a username and a job id, create a job application for a user
     *
     *  Returns { applied: jobID }
     *
     *  If user or job doesn't exist, throws NotFoundError.
     *
     *  If user already applied to job, throws custom BadRequestError.
     */

    static async createJobApplication(username, jobId) {
        // Note: Utilizing multiple queries here to provide more helpful error messages.
        // If efficiency is more important, remove userCheck & jobCheck queries and rely on SQL error.

        // Check if the username exists
        const userCheck = await db.query(`SELECT username FROM users WHERE username = $1`, [
            username,
        ]);

        if (userCheck.rows.length === 0) {
            throw new NotFoundError(`User ${username} does not exist.`);
        }

        // Check if the job_id exists
        const jobCheck = await db.query(`SELECT id FROM jobs WHERE id = $1`, [jobId]);

        if (jobCheck.rows.length === 0) {
            throw new NotFoundError(`Job with ID ${jobId} does not exist.`);
        }

        try {
            const applicationRes = await db.query(
                `INSERT INTO applications (username, job_id)
                 VALUES ($1, $2)
                 RETURNING job_id as applied`,
                [username, jobId]
            );

            const applied = applicationRes.rows[0];
            return applied;
        } catch (err) {
            // throw error with more helpful message for duplicate application
            if (err.code === "23505")
                throw new BadRequestError(
                    `User ${username} already has application for job ${jobId}.`
                );
        }
    }
}

module.exports = User;
