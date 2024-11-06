const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const followerSchema = new Schema({
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
});


const Followers = mongoose.model("follower", followerSchema,'followers');

module.exports =Followers;