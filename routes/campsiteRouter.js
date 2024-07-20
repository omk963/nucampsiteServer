const express = require('express');
const Campsite = require('../models/campsite');
const authenticate = require('../authenticate');
const mongoose = require('mongoose');

const campsiteRouter = express.Router();

campsiteRouter.route('/')
    .get(async (req, res, next) => {
        try {
            const campsites = await Campsite.find().populate('comments.author');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(campsites);
        } catch (err) {
            next(err);
        }
    })
    .post(authenticate.verifyUser, async (req, res, next) => {
        try {
            const campsite = await Campsite.create(req.body);
            console.log('Campsite Created', campsite);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(campsite);
        } catch (err) {
            next(err);
        }
    })
    .put(authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /campsites');
    })
    .delete(authenticate.verifyUser, async (req, res, next) => {
        try {
            const response = await Campsite.deleteMany();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(response);
        } catch (err) {
            next(err);
        }
    });

campsiteRouter.route('/:campsiteId')
    .get(async (req, res, next) => {
        try {
            const campsite = await Campsite.findById(req.params.campsiteId).populate('comments.author');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(campsite);
        } catch (err) {
            next(err);
        }
    })
    .post(authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`POST operation not supported on /campsites/${req.params.campsiteId}`);
    })
    .put(authenticate.verifyUser, async (req, res, next) => {
        try {
            const campsite = await Campsite.findByIdAndUpdate(req.params.campsiteId, {
                $set: req.body
            }, { new: true });
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(campsite);
        } catch (err) {
            next(err);
        }
    })
    .delete(authenticate.verifyUser, async (req, res, next) => {
        try {
            const response = await Campsite.findByIdAndDelete(req.params.campsiteId);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(response);
        } catch (err) {
            next(err);
        }
    });

campsiteRouter.route('/:campsiteId/comments')
    .get(async (req, res, next) => {
        try {
            const campsite = await Campsite.findById(req.params.campsiteId).populate('comments.author');
            if (campsite) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite.comments);
            } else {
                const err = new Error(`Campsite ${req.params.campsiteId} not found`);
                err.status = 404;
                return next(err);
            }
        } catch (err) {
            next(err);
        }
    })
    .post(authenticate.verifyUser, async (req, res, next) => {
        try {
            const campsite = await Campsite.findById(req.params.campsiteId);
            if (campsite) {
                // Verify and log author information
                req.body.author = req.user._id;
                console.log("Before saving, author is:", req.body.author, typeof(req.body.author));
                if (!mongoose.Types.ObjectId.isValid(req.body.author)) {
                    const err = new Error('Invalid author ID');
                    err.status = 400;
                    return next(err);
                }
                campsite.comments.push(req.body);
                
                // Log comments before saving
                console.log('Campsite comments before save:', campsite.comments);

                campsite.comments.forEach(comment => {
                    console.log(comment.author, typeof(comment.author))
                    if (typeof comment.author === 'string' && ObjectId.isValid(comment.author)) {
                        comment.author = new ObjectId(comment.author);
                        console.log(comment.author, typeof(comment.author))
                    }
                })

                await campsite.save();
                
                // Log success message
                console.log('Save successful');

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite);
            } else {
                const err = new Error(`Campsite ${req.params.campsiteId} not found`);
                err.status = 404;
                return next(err);
            }
        } catch (err) {
            if (err.name === 'ValidationError') {
                console.error('Validation Error:', err.message);
            } else {
                console.error('Error:', err);
            }
            next(err);
        }
    })
    .put(authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /campsites/${req.params.campsiteId}/comments`);
    })
    .delete(authenticate.verifyUser, async (req, res, next) => {
        try {
            const campsite = await Campsite.findById(req.params.campsiteId);
            if (campsite) {
                for (let i = campsite.comments.length - 1; i >= 0; i--) {
                    campsite.comments.id(campsite.comments[i]._id).deleteOne();
                }
                await campsite.save();
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite);
            } else {
                const err = new Error(`Campsite ${req.params.campsiteId} not found`);
                err.status = 404;
                return next(err);
            }
        } catch (err) {
            next(err);
        }
    });

campsiteRouter.route('/:campsiteId/comments/:commentId')
    .get(async (req, res, next) => {
        try {
            const campsite = await Campsite.findById(req.params.campsiteId).populate('comments.author');
            if (campsite && campsite.comments.id(req.params.commentId)) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(campsite.comments.id(req.params.commentId));
            } else if (!campsite) {
                const err = new Error(`Campsite ${req.params.campsiteId} not found`);
                err.status = 404;
                return next(err);
            } else {
                const err = new Error(`Comment ${req.params.commentId} not found`);
                err.status = 404;
                return next(err);
            }
        } catch (err) {
            next(err);
        }
    })
    .post(authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`POST operation not supported on /campsites/${req.params.campsiteId}/comments/${req.params.commentId}`);
    })
    .put(authenticate.verifyUser, async (req, res, next) => {
        try {
            const campsite = await Campsite.findById(req.params.campsiteId);
            if (campsite && campsite.comments.id(req.params.commentId)) {
                const comment = campsite.comments.id(req.params.commentId);
                if (comment.author.equals(req.user._id)) {
                    if (req.body.rating) {
                        comment.rating = req.body.rating;
                    }
                    if (req.body.text) {
                        comment.text = req.body.text;
                    }
                    await campsite.save();
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(campsite);
                } else {
                    const err = new Error('You are not authorized to update this comment!');
                    err.status = 403;
                    return next(err);
                }
            } else if (!campsite) {
                const err = new Error(`Campsite ${req.params.campsiteId} not found`);
                err.status = 404;
                return next(err);
            } else {
                const err = new Error(`Comment ${req.params.commentId} not found`);
                err.status = 404;
                return next(err);
            }
        } catch (err) {
            next(err);
        }
    })
    .delete(authenticate.verifyUser, async (req, res, next) => {
        try {
            const campsite = await Campsite.findById(req.params.campsiteId);
            if (campsite && campsite.comments.id(req.params.commentId)) {
                const comment = campsite.comments.id(req.params.commentId);
                if (comment.author.equals(req.user._id)) {
                    await comment.deleteOne();
                    await campsite.save();
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(campsite);
                } else {
                    const err = new Error('You are not authorized to delete this comment!');
                    err.status = 403;
                    return next(err);
                }
            } else if (!campsite) {
                const err = new Error(`Campsite ${req.params.campsiteId} not found`);
                err.status = 404;
                return next(err);
            } else {
                const err = new Error(`Comment ${req.params.commentId} not found`);
                err.status = 404;
                return next(err);
            }
        } catch (err) {
            next(err);
        }
    });

module.exports = campsiteRouter;
