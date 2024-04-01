"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");

/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
    try {
        const authHeader = req.headers && req.headers.authorization;
        if (authHeader) {
            const token = authHeader.replace(/^[Bb]earer /, "").trim();
            res.locals.user = jwt.verify(token, SECRET_KEY);
        }
        return next();
    } catch (err) {
        return next();
    }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
    try {
        if (!res.locals.user) throw new UnauthorizedError();
        return next();
    } catch (err) {
        return next(err);
    }
}

/** Require admin user to access route or raise 401 */

function ensureAdmin(req, res, next) {
    try {
        if (!res.locals.user || !res.locals.user.isAdmin) throw new UnauthorizedError();
        return next();
    } catch (err) {
        return next(err);
    }
}
// end

/** Require admin user or same user request is referring to access route or raise 401 */

function ensureAdminOrSameUser(req, res, next) {
    try {
        // get username of the route from the request params
        const username = req.params.username;

        // if not logged in, throw error
        if (!res.locals.user) throw new UnauthorizedError();

        // if not admin and not same user, throw error
        if (!res.locals.user.isAdmin && res.locals.user.username !== username)
            throw new UnauthorizedError();

        // if admin or same user, go to next handler.
        return next();
    } catch (err) {
        return next(err);
    }
}
// end

module.exports = {
    authenticateJWT,
    ensureLoggedIn,
    ensureAdmin,
    ensureAdminOrSameUser,
};
