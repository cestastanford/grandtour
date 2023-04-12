/*
*   Imports
*/

const { ROLES } = require('../constants.js')


/*
*   Checks if user is authenticated as a viewer, user, editor or administrator,
*   respectively.
*   Viewer - anyone on the site, even if they are not signed in. Can search and view entries.
*   User - anyone with an account on the site. Can create and modify lists, export, plus permissions of Viewer.
*   Editor - Can edit entries, plus permissions of User.
*   Administrator - Can do anything, plus permissions of Editor.
*/

const isViewer = (req, res, next) => {
    if (true) {
        next()
    } else {
        res.send(401)
    }
}

const isUser = (req, res, next) => {
    if (req.isAuthenticated()) {
        next()
    } else {
        res.send(401)
    }
}

const isEditor = (req, res, next) => {
    if (req.isAuthenticated() && (
        req.user.role === ROLES.editor ||
        req.user.role === ROLES.administrator
    )) {
        next()
    } else {
        res.send(401)
    }
}

const isAdministrator = (req, res, next) => {
    if (req.isAuthenticated() && req.user.role === ROLES.administrator) {
        next()
    } else {
        res.send(401)
    }
}


/*
*   Exports
*/

module.exports = { isViewer, isUser, isEditor, isAdministrator }
