const { expect } = require('chai')
const supertest = require('supertest')
const knex = require('knex')
const app = require('../src/app')
const { makeBookMarkArray } = require('./bookmark.fixtures')

describe.only('bookmark endpoints', function() {
    let db
    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => {
        db('bookmark_articles').truncate()
    })

    afterEach('cleanup', () => db('bookmark_articles').truncate())
    
    describe('GET /bookmarks', () => {
        context('given there are no articles', () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                .get('/bookmarks')
                .expect(200, [])
            })    
        })
        
        context('given the table is populated', () => {
            const testBookmarks = makeBookMarkArray()
            beforeEach('insert Articles', () => {
                return db
                .into('bookmark_articles')
                .insert(testBookmarks)
            })  
            
            it('GET /bookmarks respond with 200', () => {
                return supertest(app)
                .get('/bookmarks')
                .expect(200, testBookmarks)
            })
        })
    })
    describe('GET /bookmarks/:bookmark_id', () => {
        context('given no bookmarks', () => {
            it('responds with 404', () => {
                const bookmarkID = 12345
                return supertest(app)
                    .get(`/bookmarks/${bookmarkID}`)
                    .expect(404, {
                        error: { message: `Article doesn't exist` }                
                    })
            })
        })

        context('given there are bookmarks in the db', () => {
            const testBookmarks = makeBookMarkArray()

            beforeEach('populate bookmark db', () => {
                return db
                    .into('bookmark_articles')
                    .insert(testBookmarks)
            })
            it('should respond with 200 when requesting a bookmark', () => {

                const bookmarkID = 2
                const expectedBookmark = testBookmarks[bookmarkID - 1]
                return supertest(app)
                    .get(`/bookmarks/${bookmarkID}`)
                    .expect(200, expectedBookmark)

            })
        })
    })
})
