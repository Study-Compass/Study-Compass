const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const memberSchema = new Schema({
    org_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Org'
    },
    user_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    status: {
        //role index, see org schema for roles
        type: Number, 
        required:true,
    }
});

module.exports = memberSchema;