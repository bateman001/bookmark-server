const { expect } = require('chai')
const supertest = require('supertest')
const knex = require('knex')
const app = require('../src/app')
const { makeBookMarkArray } = require('./bookmark.fixtures')

describe('bookmark endpoints', function() {
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
    
    
    describe('GET /api/bookmarks', () => {
        context('given there are no articles', () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                .get('/api/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
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
            
            it('GET /api/bookmarks respond with 200', () => {
                return supertest(app)
                .get('/api/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .expect(200, testBookmarks)
            })
        })
    })
    describe('GET /bookmarks/:bookmark_id', () => {
        context('given no bookmarks', () => {
            it('responds with 404', () => {
                const bookmarkID = 12345
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkID}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
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
                    .get(`/api/bookmarks/${bookmarkID}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(200, expectedBookmark)

            })
        })
    })

    describe('POST /api/bookmarks', () => {
        it('will post when given data', () => {
            const newArticle = {
                title: 'new title',
                url: 'new url',
                rating: 5,
                description: 'Think outside the classroom',
            }

            return supertest(app)
                .post('/api/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
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
                        .get(`/api/bookmarks/${postRes.body.id}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(postRes.body)
                })
        })

        it('will return 400 when title is missing', () => {
            const newArticle = {
                url: 'new url',
                rating: 4
            }

            return supertest(app)
                .post('/api/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
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
                .post('/api/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
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
                .post('/api/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                .send(newArticle)
                .expect(400, {
                    error: {message: `invalid request`}
                })

        })

    })

    describe('DELETE /api/bookmarks/bookmark_id', () => {
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
                    .delete(`/api/bookmarks/${deletedId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(204)
                    .then(res => {
                        return supertest(app)
                            .get('/api/bookmarks')
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedArticle)
                    })    
            })
        })

        context('given no articles in the database', () => {
            it('will respond with a 404', () => {
                const bookmarkId = 12345

                return supertest(app)
                    .delete(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: {message: `Bookmark doesn't exist`}
                    })
            })
        })
    })

    describe('/PATCH /api/bookmarks/bookmark_id', () => {
        context('given no articles', () => {
            it('will respond with 400', () => {
                const id = 12345
                return supertest(app)
                    .patch(`/api/bookmarks/${id}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .expect(404, {
                        error: {message: `Bookmark doesn't exist`}
                    })

            })
        })

        context('given there are bookmarks in the db', () => {
            const testBookmarks = makeBookMarkArray() 

            beforeEach('populate db', () => {
                return db 
                    .into('bookmark_articles')
                    .insert(testBookmarks)
            })

            it('will update the bookmark and respond with 200', () => {
                const idToUpdate = 2
                const updateBookmark = {
                    title: 'updated article title',
                    url: 'Interview',
                    description: 'updated article content',
                    rating: 4
                }

                const expectedBookmark = {
                    ...testBookmarks[idToUpdate - 1],
                    ...updateBookmark
                }

                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send(updateBookmark)
                    .expect(204)
                    .then(res => {
                        return supertest(app)
                            .get(`/api/bookmarks/${idToUpdate}`)
                            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                            .expect(expectedBookmark)
                    })

            })

            it('responds with 400 when no required fields are supplied', () => {
                const idToUpdate = 2
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({ irrelevantField: 'foo' })
                    .expect(400, {
                        error: {message: `Request body must contain either 'title', 'url', 'rating' or 'description'`}
                    })
            })

            it(`responds with 204 when updating only a subset of fields`, () => {
                const idToUpdate = 2
                const updateBookmark = {
                    title: 'updated article title',
                }
                const expectedBookmark = {
                    ...testBookmarks[idToUpdate - 1],
                    ...updateBookmark
                }
        
                return supertest(app)
                    .patch(`/api/bookmarks/${idToUpdate}`)
                    .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                    .send({
                        ...updateBookmark,
                        fieldToIgnore: 'should not be in GET response'
                    })
                    .expect(204)
                    .then(res =>
                        supertest(app)
                        .get(`/api/bookmarks/${idToUpdate}`)
                        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
                        .expect(expectedBookmark)
                    )
            })


        })
    })
})
