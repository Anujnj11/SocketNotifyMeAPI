const express = require('express');
const router = express.Router();
const UserdetailsM = require('../Model/UserDetails');
const config = require('../config/Database');
const url = require('url');
const querystring = require('querystring');
const async = require('async');
const Request = require("request");
const crypto = require('crypto');
const ENCRYPTION_KEY = '@&*$%^$!@#anuj^^^^^####!!!!!!^^^'; // Must be 256 bytes (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16
const Mailer = require('../Mailer.js');


router.post('/getAESLogDetails', (req, res, next) => {
    var AESToken = req.body.AESToken;
    if (AESToken != undefined && AESToken != null && AESToken != "") {
        // UserdetailsM.UserDetails.find({UserId:Username,MACId:MacId,IsViewed:false},(mongoerr,mongoresponse)=>{    
        UserdetailsM.UserDetailsAESM.findOneAndUpdate({
            AESToken: AESToken,
            IsViewed: false
        }, {
            $set: {
                IsViewed: true
            }
        }, (mongoerr, mongoresponse) => {
            //  console.log("findData" + mongoresponse);
            //  console.log("mongoerr:" + mongoerr);
            if (mongoresponse != null) {
                res.json({
                    success: true,
                    Data: mongoresponse
                });
            } else {
                res.json({
                    success: false,
                    Error: mongoerr
                });
            }
        });
    } else {
        res.json({
            success: false,
            msg: 'Required AES'
        });
    }
});


router.post('/getAESallLogDetails', (req, res, next) => {
    var AESToken = req.body.AESToken;
    if (AESToken != undefined && AESToken != null && AESToken != "") {
        UserdetailsM.UserDetailsAESM.find({
            AESToken: AESToken
        }, (mongoerr, mongoresponse) => {
            if (mongoresponse != null) {
                res.json({
                    success: true,
                    Data: mongoresponse
                });
            } else {
                res.json({
                    success: false,
                    Error: mongoerr
                });
            }
        });
    } else {
        res.json({
            success: false,
            msg: 'Required AES'
        });
    }
});

//Generate AES Token for mobile
router.post('/getEncrpToken', (req, res, next) => {
    var Username = req.body.Username;
    var password = req.body.password;
    if (Username != null && Username != undefined && password != null && password != undefined) {
        var Token = encrypt(password.trim() + " || " + Username.trim());
        var ObjUserLoginTokenM = new UserdetailsM.UserLoginTokenM({
            UserId: Username,
            Password: password,
            AESToken: Token,
            Date: new Date().toDateString(),
            IsValid: true
        });
        ObjUserLoginTokenM.save((mongoerr, success) => {
            if (mongoerr != null) res.json({
                success: false,
                msg: 'Not added',
                error: mongoerr,
                AESToken: ""
            });
            else
                res.json({
                    success: true,
                    msg: 'Added',
                    AESToken: Token
                });
        });
    } else {
        res.json({
            success: false,
            msg: 'Value required'
        });
    }
});



//Get AES token for chrome addon
router.post('/GetLoginToken', (req, res) => {
    var Username = req.body.Username;
    var password = req.body.password;
    if (Username != null && Username != undefined && password != null && password != undefined) {
        UserdetailsM.UserLoginTokenM.findOne({
            UserId: Username,
            Password: password,
            Date: new Date().toDateString()
        }, (mongoerr, mongoresponse) => {
            if (mongoresponse != null) {
                res.json({
                    success: true,
                    AESToken: mongoresponse.AESToken
                });
            } else {
                res.json({
                    success: false,
                    Error: mongoerr
                });
            }
        });

    }
});


// router.post('/postExceptionDetails', (req, res) => {
//     var Exception = req.body.Exception;
//     if (Exception != "" && Exception != null) {
//         var ObjExceptionUserDetailsM = new UserdetailsM.ExceptionUserDetailsM({
//             Exception: Exception,
//             Date: new Date().toDateString()
//         });
//         ObjExceptionUserDetailsM.save();
//     }
// });


//Decryption Code
// router.post('/getDecrToken', (req, res, next) => {
//     var Username = req.body.Token;
//     if (Username != null && Username != undefined) {
//         var Token = decrypt(Username.toUpperCase());
//         res.json({
//             success: true,
//             msg: 'Added',
//             AESDescToken: Token
//         });
//     } else {
//         res.json({
//             success: false,
//             msg: 'Value required'
//         });
//     }
// });


function encrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', new Buffer(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);

    encrypted = Buffer.concat([encrypted, cipher.final()]);

    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    let textParts = text.split(':');
    let iv = new Buffer(textParts.shift(), 'hex');
    let encryptedText = new Buffer(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', new Buffer(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString();
}

var GetAESLog = async function (AESToken, callBack) {
    var Response;
    if (AESToken != null && AESToken != "") {
        try {
            await UserdetailsM.UserDetailsAESM.find({
                AESToken: AESToken
            }, (mongoerr, mongoresponse) => {
                if (mongoresponse != null) {
                    Response = JSON.stringify({
                        success: true,
                        Data: mongoresponse,
                        isError: false
                    });
                    callBack(Response);
                } else {
                    Mailer(mongoerr);
                    Response = JSON.stringify({
                        success: false,
                        Data: mongoerr,
                        isError: false
                    });
                    callBack(Response);
                }
            });
        } catch (err) {
            Mailer(err);
            Response = JSON.stringify({
                success: false,
                Data: "",
                isError: true
            });
            callBack(Response);
        }
    }
}


module.exports = router;
module.exports.AESLogDetails = GetAESLog;