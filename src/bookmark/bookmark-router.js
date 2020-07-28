express = require('express')
const bodyParser = express.json()
const logger = require('../logger')
const bookmarkRouter = express.Router()
const bookmarkService = require('./bookmarkService')
const xss = require('xss')

bookmarkRouter
    .route('/api/bookmarks')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        bookmarkService.getAllBookMarks(knexInstance)
            .then(bookmarks => res.json(bookmarks))
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { title, url, rating, description } = req.body 
        const bookmark = {title, url, rating, description}
        const knexInstance = req.app.get('db')

        if(!title || !url || !rating || !description){
            logger.error("Title, url or rating is undefined")
            return res.status(400).json({
                error: {message: `invalid request`}
            })
        }

        bookmarkService.insertBookMark(knexInstance, bookmark)
            .then(bookmarks => {
                logger.info(`bookmark with ${bookmarks.id} created`)
               return res.status(201)
                    .location(`http://localhost:8000/bookmarks/${bookmarks.id}`)
                    .json(bookmarks)
            })
            .catch(next)
    })


bookmarkRouter
    .route('/api/bookmarks/:bookmark_id')
    .all((req, res, next) => {
        bookmarkService.getById(req.app.get('db'), req.params.bookmark_id)
            .then(bookmark => {
                if(!bookmark){
                    return res.status(404).json({
                        error: {message: `Bookmark doesn't exist`}
                    })
                }

                res.bookmark = bookmark
                next()
            })
            .catch(next)
    })
    .get((req, res, next) => {
        res.json({
            id: res.bookmark.id,
            title: xss(res.bookmark.title),
            url: res.bookmark.url,
            rating: res.bookmark.rating, //xss converts int to string why and how to fix?
            description: res.bookmark.description
        })
    })
    .delete((req,res, next) => {
        const id  = req.params.bookmark_id

        if(!id){
            logger.error('No id was given') 
            res.status(400).send('invalid request') 
        }

        bookmarkService.deleteBookMark(req.app.get('db'), id)
            .then(bookmark => {
                logger.info(`bookmark with ${id} was deleted`)
                return res.status(204).end()
            })
            .catch(next)
    })
    .patch(bodyParser, (req, res, next) => {
        const {title, url, description, rating } = req.body
        const bookmarkToUpdate = { title, url, description, rating}

        const numberOfValues = Object.values(bookmarkToUpdate).filter(Boolean).length
        if(!req.params.bookmark_id){
            return res.status(404).json({
                error: {message: 'bookmark id is required'}
            })
        }
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {message: `Request body must contain either 'title', 'url', 'rating' or 'description'`}
            })
        }

        bookmarkService.updateBookMark(req.app.get('db'), req.params.bookmark_id, bookmarkToUpdate)
            .then(bookmark => {
                res.status(204).end()
            })
            .catch(next)

    })

    module.exports = bookmarkRouter
