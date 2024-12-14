const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrgSchema= new Schema({
    org_name:{
        type:String,
        required: true
    },
    org_profile_image:{
        type: String,
        required: true
    },
    org_description:{
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


const Org = mongoose.model('Org', OrgSchema,'orgs');

module.exports=Org;
