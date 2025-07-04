/*
*   Imports
*/

const router = require('express').Router()
const passport = require('passport')
const User = require('../models/user')
const { isAuthenticated, isAdministrator } = require('./auth')


/*
*   User management routes:
*
*   - Check if a user is logged in
*   - Add new user
*   - Login
*   - Logout
*/

router.get('/loggedin', (req, res) => {
    res.send(req.isAuthenticated() ? req.user : '0')
})

// router.post('/register', isAdministrator, (req, res, next) => {
//     User.register(new User(req.body), req.body.password, (err, data) => {
//         // problem registering the new user...
//         if (err) { return res.status(401).send(err) }
//         // if ok, let's login the new user
//         req.logIn(data, (err) => {
//             if (err) { return res.status(401).send(err) }
//             return res.status(200).send(data)
//         })
//     })
// })

// router.post('/login', function(req, res, next) {
//     passport.authenticate('local', function(err, user, info) {
//         if (err) { return res.status(401).send(err) }
//         if (!user) { return res.status(401).send(info) }
//         req.logIn(user, function(err) {
//             if (err) { return res.status(401).send({ error: err }) }
//             return res.status(200).send({ username: user.username })
//         })
//     })(req, res, next)
// });

// router.post('/signup', (req, res, next) => {
//   // TODO: Make sure email is unique.
//   // TODO: Add a confirmation / verification email upon signup.
//   const {username, fullName, email, password} = req.body;
//   User.register(new User({username, fullName, email}), password, (err, data) => {
//     if (err) { return res.status(401).send(err) }
//     return res.status(200).send({user: data});
//   })
// })

// router.post('/logout', function(req, res){
//     req.logOut()
//     res.sendStatus(200)
// })


/*
*   API routes for user management:
*
*   - Get all users
*   - Add new user
*   - Remove user
*   - Update user
*/

// router.get('/api/users', isAdministrator, (req, res, next) => {

//     User.find()
//     .then(users => res.json({ users }))
//     .catch(next)

// });

// router.post('/api/users/add', isAdministrator, (req, res, next) => {
//   User.register(new User(req.body), req.body.password, (err, data) => {
//     // problem registering the new user...
//     if (err) { return res.status(401).send(err) }
//     // if ok, let's login the new user
//     return res.status(200).send({ user: data })
//   })
// })

// router.post('/api/users/remove', isAdministrator, (req, res, next) => {
//   User.find({ username: req.body.username }).remove((err,data) => {
//     if (err) { return res.status(401).send(err) }
//     return res.status(200).send({ removed: data })
//   })
// })

// router.post('/api/users/update', isAdministrator, (req, res, next) => {
//   User.findOneAndUpdate({ username: req.body.username || req.user.username }, req.body, { new: true }, (err, data) => {
//     if (err) { return res.status(401).send(err) }
//     return res.status(200).send(data)
//   })
// })


/*
*   Exports
*/

module.exports = router
