express = require('express')
const bodyParser = express.json()
const logger = require('../logger')
const { v4: uuid} = require('uuid')
const { bookmarks } = require('../Store')
const bookmarkRouter = express.Router()
const bookmarkService = require('./bookmarkService')

bookmarkRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        bookmarkService.getAllBookMarks(knexInstance)
            .then(bookmarks => res.json(bookmarks))
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { title, url, rating } = req.body 

        if(!title || !url || !rating){
            logger.error("Title, url or rating is undefined")
            return res.status(400).send('invalid request')
        }

        const bookmark = {
            title,
            url,
            rating
        }

        const knexInstance = req.app.get('db')

        bookmarkService.insertBookMark(knexInstance, bookmark).then(bookmark => {
           logger.info(`bookmark with ${id} created`)
           return res.status(200).location(`http://localhost:8000/bookmark/${id}`).json(bookmark)
        })
    })


bookmarkRouter
    .route('/bookmarks/:bookmark_id')
    .get((req, res, next) => {
        const  id  = req.params.bookmark_id
        const knexInstance = req.app.get('db')
        if(!id){
            logger.error("Did not recieve id")
            res.status(400).send('invalid request')
        }

        bookmarkService.getById(knexInstance, id)
            .then(bookmark => {
                if(!bookmark){
                   return res.status(404).json({
                        error: { message: `Article doesn't exist` }                
                    })
                }
                logger.info(`bookmark with ${id} was found`)
                res.status(200).json(bookmark)    
            })   
            .catch(next)     
    })
    .delete((req,res) => {
        const { id } = req.params
        console.log(id)
        if(!id){
            logger.error('No id was given') 
            res.status(400).send('invalid request') 
        }

        const bookmarkIndex = bookmarks.findIndex(b => b.id == id)

        if(bookmarkIndex === -1){
            logger.error(`${id} not found`)
            res.status(404).send(`${id} nod found`)
        }

        bookmarks.splice(bookmarkIndex, 1)

        logger.info(`bookmark with ${id} was deleted`)
        res.status(204).end()
    })
    

    module.exports = bookmarkRouter
