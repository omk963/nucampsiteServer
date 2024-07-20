const express = require('express');
const User = require('../models/user');
const passport = require('passport');
const authenticate = require('../authenticate');

const router = express.Router();

/* GET users listing. */
router.route('/')
    .get(authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
        try {
            const users = await User.find().populate()
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(users);
        } catch (err) {
            next(err);
        }
        
});

router.post('/signup', async (req, res) => {
    try {
        const user = new User({ username: req.body.username });
        const registeredUser = await User.register(user, req.body.password);

        if (req.body.firstname) {
            registeredUser.firstname = req.body.firstname;
        }
        if (req.body.lastname) {
            registeredUser.lastname = req.body.lastname;
        }

        await registeredUser.save();

        passport.authenticate('local')(req, res, () => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({ success: true, status: 'Registration Successful!' });
        });
    } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({ err: err });
    }
});

router.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
    const token = authenticate.getToken({ _id: req.user._id });
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({ success: true, token: token, status: 'You are successfully logged in!' });
});

router.get('/logout', (req, res, next) => {
    if (req.session) {
        req.session.destroy();
        res.clearCookie('session-id');
        res.redirect('/');
    } else {
        const err = new Error('You are not logged in!');
        err.status = 401;
        return next(err);
    }
});

module.exports = router;
