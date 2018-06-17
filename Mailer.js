const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
           user: 'notifymemailer08@gmail.com',
           pass: '9022171228'
       }
   });


 var ExceptionCal = function(err)
{
    const mailOptions = {
        from: 'notifymemailer08@gmail.com', // sender address
        to: "guptaanuj0811@gmail.com",
        subject: "Error in NODE JS: ",
        text: (new Date()).toUTCString() + "\n\n" +
        err.message + "\n\n" +
        err.stack
    };
    
    transporter.sendMail(mailOptions, function (err, info) {
        if(err)
          console.log('error while mailing')
        else
          console.log('success');
     });
}
    
module.exports = ExceptionCal;