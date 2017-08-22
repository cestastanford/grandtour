/*
*   LinkedFootnotes represent bibliography entries listed at the
*   beginning of the Dictionary and are referenced in the footnotes
*   of individual Entries.
*/


/*
*   Imports
*/

const mongoose = require('mongoose')
const Entry = require('./entry')


/*
*   Defines the LinkedFootnote schema.
*/

const linkedFootnoteSchema = mongoose.Schema({
    
    abbreviation: { type: String, required: true },
    fullText: { type: String, required: true },

})


/*
*   Defines the static and instance methods for the LinkedFootnote class.
*/

class LinkedFootnote {


    /*
    *   Queries for LinkedFootnotes whose abbreviations are present
    *   in a given string.
    */

    static async findAllFromString(str) {

        const matchingFootnotes = []
        const linkedFootnotes = await this.find({})
        for (let i = 0; i < linkedFootnotes.length; i++) {

            const footnote = linkedFootnotes[i]
            let index 
            while (index !== -1) {

                index = str.indexOf(footnote.abbreviation, index ? index + 1 : 0)
                if (index !== -1) matchingFootnotes.push({

                    abbreviation: footnote.abbreviation,
                    fullText: footnote.fullText,
                    startIndex: index,
                    endIndex: index + footnote.abbreviation.length,

                })

            }       

        }

        return matchingFootnotes
    
    }

}


/*
*   Attaches static and instance methods and creates LinkedFootnote model.
*/

linkedFootnoteSchema.loadClass(LinkedFootnote)
const linkedFootnoteModel = mongoose.model('LinkedFootnote', linkedFootnoteSchema)


/*
*   Exports
*/

module.exports = linkedFootnoteModel
