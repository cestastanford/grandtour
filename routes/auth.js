/*
*   Imports
*/

const { ROLES } = require('../constants.js')


/*
*   Checks if user is authenticated as a viewer, editor or administrator,
*   respectively.  Note that administrators have all of the privileges
*   of editors, and editors have all of the privileges of viewers.
*/

exports.isViewer = (req, res, next) => {
    if (req.isAuthenticated()) {
        next()
    } else {
        res.send(401)
    }
}

exports.isEditor = (req, res, next) => {
    if (req.isAuthenticated() && (
        req.user.role === ROLES.editor ||
        req.user.role === ROLES.administrator
    )) {
        next()
    } else {
        res.send(401)
    }
}

exports.isAdministrator = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === ROLES.administrator) {
        next()
    } else {
        res.send(401)
    }
}
