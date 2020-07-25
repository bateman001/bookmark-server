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
                        error: { message: `Bookmark doesn't exist` }                
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

    describe('POST /bookmarks', () => {
        it('will post when given data', () => {
            const newArticle = {
                title: 'new title',
                url: 'new url',
                rating: 5,
                description: 'Think outside the classroom',
            }

            return supertest(app)
                .post('/bookmarks')
                .send(newArticle)
                .expect(201)
                .expect(res => {
                    console.log(res)
                    expect(res.body.title).to.eql(newArticle.title)
                    expect(res.body.url).to.eql(newArticle.url)
                    expect(res.body.rating).to.eql(newArticle.rating)
                    expect(res.body).to.have.property('id')

                })
                .then(postRes => {
                    return supertest(app)
                        .get(`/bookmarks/${postRes.body.id}`)
                        .expect(postRes.body)
                })
        })

        it('will return 400 when title is missing', () => {
            const newArticle = {
                url: 'new url',
                rating: 4
            }

            return supertest(app)
                .post('/bookmarks')
                .send(newArticle)
                .expect(400, {
                    error: {message: `invalid request`}
                })

        })

        it('will return 400 when url is missing', () => {
            const newArticle = {
                title: 'new title',
                rating: 4
            }

            return supertest(app)
                .post('/bookmarks')
                .send(newArticle)
                .expect(400, {
                    error: {message: `invalid request`}
                })

        })

        it('will return 400 when content is missing', () => {
            const newArticle = {
                title: 'new title',
                url: 'new url'
            }

            return supertest(app)
                .post('/bookmarks')
                .send(newArticle)
                .expect(400, {
                    error: {message: `invalid request`}
                })

        })

    })

    describe('DELETE /bookmarks/bookmark_id', () => {
        context('given there are articles in the database', () => {
            const newBookMarks = makeBookMarkArray();
            beforeEach('populate database', () => {
                return db
                    .into('bookmark_articles')
                    .insert(newBookMarks)
                })

            it('will respond with 204 and remove the article', () => {
                const deletedId = 2
                const expectedArticle = newBookMarks.filter(bookmark => bookmark.id !== deletedId)
    
                return supertest(app)
                    .delete(`/bookmarks/${deletedId}`)
                    .expect(204)
                    .then(res => {
                        return supertest(app)
                            .get('/bookmarks')
                            .expect(expectedArticle)
                    })    
            })
        })

        context('given no articles in the database', () => {
            it('will respond with a 404', () => {
                const bookmarkId = 12345

                return supertest(app)
                    .delete(`/bookmarks/${bookmarkId}`)
                    .expect(404, {
                        error: {message: `Bookmark doesn't exist`}
                    })
            })
        })
    })
})
