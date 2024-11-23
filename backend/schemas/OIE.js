const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OIESchema = new mongoose.Schema({
    eventRef : {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Event'
    },
    status: {
        type: String,
        required: true,
        enum: ['Pending', 'Approved', 'Rejected']
    },
    checkListItems: {
        type: Array,
        default: []
    }
}, {
    timestamps: true
});

const OIEStatus = mongoose.model('OIEStatus', OIESchema , 'OIEStatuses');

module.exports = OIEStatus;