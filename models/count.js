/*
*   Count documents save the number of entries with a non-null value
*   for a given field.
*/

const mongoose = require('mongoose')
const COUNT = 'Count'
const countSchema = new mongoose.Schema({
  
  field: String,
  count: Number,

})

module.exports = {

    Count: mongoose.model(COUNT, countSchema),

}
