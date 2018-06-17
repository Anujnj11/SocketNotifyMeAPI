const mongoose = require('mongoose');
const config = require('../config/Database');


//Online Schmema generation https://transform.now.sh/json-to-mongoose#


const UserDetailsAES = mongoose.Schema({
    AESToken: String,
    Message: String,
    Date: String,
    CallLog: String,
    IsCall: Boolean,
    IsSMS: Boolean,
    IsViewed: Boolean,
    MobileNumber: String
});


const UserLoginToken = mongoose.Schema({
    UserId: String,
    Password: String,
    Date: String,
    AESToken: String,
    IsValid: Boolean
});

const MessageBodyReply = mongoose.Schema({
    Date: String,
    AESToken: String,
    MobileNumber :String,
    Message:String
});


const UserDetailsAESModel = mongoose.model('UserDetailsAESSocket', UserDetailsAES);
const UserLoginTokenModel = mongoose.model('UserLoginTokenSocket', UserLoginToken);
const MessageBodyReplyModel = mongoose.model('MessageBodyReplySocket', MessageBodyReply);


module.exports = {
    UserLoginTokenM: UserLoginTokenModel,
    UserDetailsAESM: UserDetailsAESModel,
    MessageBodyReplyM:MessageBodyReplyModel
};