/*
*   Imports
*/

const fs = require('fs')


/*
*   Transforms primitive type constructors into strings.
*/

const getTypeAsString = type => {

    if (type.type) type = type.type
    if (type === String) return 'string'
    else if (type === Number) return 'number'
    else if (type === Boolean) return 'boolean'

}


/*
*   Transforms an object of primitive type constructors into an
*   object of strings.
*/

const getTypeObjectAsStringObject = typeObject => {

    const stringObject = {}
    for (let key in typeObject) stringObject[key] = getTypeAsString(typeObject[key])
    return stringObject

}


/*
*   Defines the EntryField class, with helper instance methods.
*/


class EntryField {


    /*
    *   Attaches properties.
    */

    constructor(properties) {
        
        Object.assign(this, properties)

        //  For JSON responses
        this.serialized = {
            isArrayOfValues: this.isArrayOfValues(),
            valueIsObject: this.valueIsObject(),
            type: this.valueIsObject() ?
                getTypeObjectAsStringObject(this.getValueType()) :
                getTypeAsString(this.getValueType()),
        }

        if (this.valueIsObject()) {
            this.getValueType()._id = false
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

const getEntryFields = () => {

    const entryFields = {}
    fs.readdirSync(__dirname).filter(filename => filename.match(/\.js$/) && filename !== 'index.js').forEach(filename => {

        const entryField = require(`./${filename}`)
        entryFields[entryField.key] = new EntryField(entryField)

    })

    return entryFields

}


/*
*   Exports
*/

module.exports = getEntryFields
