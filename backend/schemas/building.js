const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const buildingSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    number_of_ratings: {
        type: Number
    },
    average_rating: {
        type: Number
    },
    time: {
        start:{
            type: Number,
            required: true
        },
        end:{
            type: Number,
            required: true
        }
    }
});


const Building = mongoose.model('Building', buildingSchema, 'buildings');

module.exports = Building;