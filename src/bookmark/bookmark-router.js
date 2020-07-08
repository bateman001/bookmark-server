express = require('express')
const bodyParser = express.json()
const logger = require('../logger')
const { v4: uuid} = require('uuid')
const { bookmarks } = require('../Store')
const bookmarkRouter = express.Router()


bookmarkRouter
    .route('/bookmarks')
    .get((req, res) => {
        res.json(bookmarks)
        console.log("bookmarks")
    })
    .post(bodyParser, (req, res) => {
        const { title, url, rating } = req.body 

        if(!title || !url || !rating){
            logger.error("Title, url or rating is undefined")
            return res.status(400).send('invalid request')
        }

        const id = uuid();
        const bookmark = {
            id,
            title,
            url,
            rating
        }

        bookmarks.push(bookmark)
        logger.info(`bookmark with ${id} created`)
        res.status(200).location(`http://localhost:8000/bookmark/${id}`).json(bookmark)
    })


bookmarkRouter
    .route('/bookmarks/:id')
    .get((req, res) => {
        const { id } = req.params
        console.log('id: ', id)
        if(!id){
            logger.error("Did not recieve id")
            res.status(400).send('invalid request')
        }

        const bookmark = bookmarks.find(b => b.id == id)

        if(bookmark === -1){
            logger.error(`${id} was not found in bookmarks`)
            return res.status(404).send('bookmark not found')
        }
        
        logger.info(`bookmark with ${id} was found`)
        res.status(200).json(bookmark)
    })
    .delete((req,res) => {
        const { id } = req.params
        console.log(id)
        if(!id){
            logger.error('No id was given') 
            res.status(400).send('invalid request') 
        }

        const bookmarkIndex = bookmarks.findIndex(b => b.id == id)

        if(bookmark === -1){
            logger.error(`${id} not found`)
            res.status(404).send(`${id} nod found`)
        }

        bookmarks.splice(bookmarkIndex, 1)

        logger.info(`bookmark with ${id} was deleted`)
        res.status(204).end()
    })
    

    module.exports = bookmarkRouter
