const BookmarkService = {
    
    getAllBookMarks(knex){
       return knex.select('*').from('bookmark_articles')
    },

    getById(knex, id){
        return knex.select('*').from('bookmark_articles').where('id', id).first()
    },

    insertBookMark(knex, newBookmark){
        return knex
            .insert(newBookmark)
            .into('bookmark_articles')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },

    deleteBookMark(knex, id){
        return knex('bookmark_articles')
            .where({ id })
            .delete()
    },

    updateBookMark(knex, id, newBookmarkField){
        return knex('bookmark_articles')
            .where({ id })
            .update(newBookmarkField)
    }
}

module.exports = BookmarkService;