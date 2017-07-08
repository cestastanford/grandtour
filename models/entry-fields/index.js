/*
*   Imports
*/

const fs = require('fs')


/*
*   Defines the EntryField class, with helper instance methods.
*/


class EntryField {


    /*
    *   Attaches properties.
    */

    constructor(properties) {
        
        Object.assign(this, properties)
        if (this.valueIsObject()) {
            this.serializedValueType = Object.keys(this.getValueType())
            this.getValueType()._id = false
        }

        //  For JSON responses
        this.typeInfo = {
            isArrayOfValues: this.isArrayOfValues(),
            valueIsObject: this.valueIsObject(),
        }

    }


    /*
    *   Instance method for determinging whether the type is an
    *   array of values.
    */

    isArrayOfValues() { return Array.isArray(this.type) }


    /*
    *   Instance method for retrieving the type out of the type
    *   array, if it's in one.
    */

    getValueType() { return this.isArrayOfValues() ? this.type[0] : this.type }


    /*
    *   Instance method for determining if an entry field holds
    *   an object (or array of objects) or a primitive (or array of 
    *   primitives).
    */

    valueIsObject() {
        const type = this.getValueType()
        return type instanceof Object &&
            type !== String &&
            type !== Number &&
            type !== Boolean
    }

}


const entryFields = {}
fs.readdirSync(__dirname).filter(filename => filename.match(/\.js$/) && filename !== 'index.js').forEach(filename => {

    const entryField = require(`./${filename}`)
    entryFields[entryField.key] = new EntryField(entryField)

})


/*
*   Exports
*/

module.exports = entryFields
