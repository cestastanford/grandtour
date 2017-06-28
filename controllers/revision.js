/*
*   Defines the static and instance methods for the Revision class.
*/

const statics = {}
const methods = {}


/*
*   Creates a new Revision.
*/

statics.create = async function(name) {

    const nRevisions = await this.count()
    const newRevision = new this({
        index: nRevisions + 1,
        name,
    })

    await newRevision.save()
    return newRevision

}


/*
*   Exports
*/

module.exports = { statics, methods }
