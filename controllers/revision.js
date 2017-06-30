/*
*   Defines the static and instance methods for the Revision class.
*/

module.exports = class Revision {

    
    /*
    *   Creates a new Revision.
    */

    static async create(name) {

        const nRevisions = await this.count()
        const newRevision = new this({
            index: nRevisions + 1,
            name,
        })

        await newRevision.save()
        return newRevision

    }


    /*
    *   Retrieves the latest Revision index.
    */

    static async getLatestIndex() {

        const revision = await this.findOne({})
        .sort({ index: 'desc' })
        .limit(1)

        return revision.index

    }

}
