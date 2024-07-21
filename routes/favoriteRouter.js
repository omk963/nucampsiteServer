const express = require('express');
const Favorite = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, authenticate.verifyUser, async (req, res, next) => {
        try {
            const favorites = await Favorite.find({ user: req.user._id })
                .populate('user')
                .populate('campsites')
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorites);
        } catch (err) {
            next(err);
        }
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
        try {
            const favorites = await Favorite.findOne({ user: req.user._id })
            if (favorites) {
                req.body.forEach(campsite => {
                    if (!favorites.campsites.includes(campsite._id)) {
                        favorites.campsites.push(campsite._id)
                    }
                })

                await favorites.save()

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }
            else {
                Favorite.create({ user: req.user._id, campsites: req.body.map(campsite => campsite._id) })
                    .then(favorite => {
                        console.log('Favorite Created ', favorite);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    })
            }
        }
        catch (err) {
            next(err);
        }
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorites');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
        try {
            const favorites = await Favorite.findOne({ user: req.user._id })
            if (!favorites) {
                res.setHeader('Content-Type', 'text/plain');
                res.end('You do not have any favorites to delete.');
            }
            await Favorite.findOneAndDelete({ user: req.user._id })
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(favorites)
        }
        catch (err) {
            next(err);
        }
    });

favoriteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res) => {
        res.statusCode = 403;
        res.end(`GET operation not supported on /Favorites/${req.params.campsiteId}`);
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
        try {
            const favorites = await Favorite.findOne({ user: req.user._id })
            if (favorites) {
                if (favorites.campsites.includes(req.params.campsiteId)) {
                    res.end("That campsite is already in the list of favorites!")
                }
                else {
                    favorites.campsites.push(req.params.campsiteId)
                    await favorites.save();
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorites);
                }
            }
            else {
                Favorite.create({ user: req.user._id, campsites: [req.params.campsiteId] })
                    .then(favorite => {
                        console.log('Favorite Created ', favorite);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(favorite);
                    })
            }
        }
        catch (err) {
            next(err);
        }
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /Favorites/${req.params.campsiteId}`);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
        try {
            const favorite = await Favorite.findOne({ user: req.user._id })
            if (favorite) {
                if (favorite.campsites.includes(req.params.campsiteId)) {
                    const camp = favorite.campsites.filter(campsite => campsite._id.toString() !== req.params.campsiteId)
                    favorite.campsites = camp
                    await favorite.save()

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
                }
                else {
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('Campsite not found in favorites.');
                }
            }
            else {
                res.setHeader('Content-Type', 'text/plain');
                res.end('You do not have any favorites to delete.');
            }
        }
        catch (err) {
            next(err);
        }
    });

module.exports = favoriteRouter;