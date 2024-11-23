const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const clubSchema= new Schema({
    club_name:{
        type:String,
        required: true
    },
    club_profile_image:{
        type: String,
        required: true
    },
    club_description:{
        type: String,
        required: true
    },
    positions: {
        type: Array, // [regular, treasurer, secretary]
        required: true,
        default:['chair', 'officer', 'regular'] //add more complex roles, include permissions
    },
    weekly_meeting:{
        type: Object, //Times,Data, Room Location
        required: false
    },
    owner: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }

});


const Club =mongoose.model('Club',clubSchema,'clubs');

module.exports=Club;
