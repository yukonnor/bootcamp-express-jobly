"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureAdmin, ensureAdminOrSameUser } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();

/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin
 **/

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map((e) => e.stack);
            throw new BadRequestError(errs);
        }

        const user = await User.register(req.body);
        const token = createToken(user);
        return res.status(201).json({ user, token });
    } catch (err) {
        return next(err);
    }
});

/** GET / => { users: [ {username, firstName, lastName, email, jobs }, ... ] }
 *
 * Returns list of all users: { users: [ {username, firstName, lastName, email, jobs }, ... ] }
 * Where jobs is a list of all jobs the user hass applied to: jobs: [ jobId, jobId, ... ]
 *
 * Authorization required: admin
 **/

router.get("/", ensureAdmin, async function (req, res, next) {
    try {
        const users = await User.findAll();
        return res.json({ users });
    } catch (err) {
        return next(err);
    }
});

/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin, jobs }
 * Where jobs is a list of all jobs the user hass applied to: jobs: [ jobId, jobId, ... ]
 *
 * Authorization required: admin or same user
 **/

router.get("/:username", ensureAdminOrSameUser, async function (req, res, next) {
    try {
        const user = await User.get(req.params.username);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Note: This route does not support updates to isAdmin. To handle in future,
 * create a separate admin-only route.
 *
 * Authorization required: admin or same user
 **/

router.patch("/:username", ensureAdminOrSameUser, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, userUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map((e) => e.stack);
            throw new BadRequestError(errs);
        }

        const user = await User.update(req.params.username, req.body);
        return res.json({ user });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: admin or same user
 **/

router.delete("/:username", ensureAdminOrSameUser, async function (req, res, next) {
    try {
        await User.remove(req.params.username);
        return res.json({ deleted: req.params.username });
    } catch (err) {
        return next(err);
    }
});

/** POST /users/[username]/jobs/[id]  =>  { applied: jobId }
 *
 * Creates job application for user.
 *
 * Authorization required: admin or same user
 **/

router.post("/:username/jobs/:id", ensureAdminOrSameUser, async function (req, res, next) {
    try {
        const applied = await User.createJobApplication(req.params.username, req.params.id);
        return res.status(201).json(applied);
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
