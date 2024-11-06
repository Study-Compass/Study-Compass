const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const memberSchema = new Schema({
    club_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Club'
    },
    user_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    status: {
        //Ranking in club
        type: Number, 
        required:true,
    }
});


const ClubMember = mongoose.model('ClubMember', memberSchema, 'members');

module.exports = ClubMember;