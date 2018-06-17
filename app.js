var app = require('express')();
const bodyparser = require('body-parser');
const cors = require('cors');
var http = require('http').Server(app);
var io = require('socket.io')(http);
const mongoose = require('mongoose');
const Mailer = require('./Mailer.js');
const UserdetailsM = require('./Model/UserDetails.js');
const config = require('./config/Database.js');
const UserLogAPI  = require('./API/UserAPI');


var port = process.env.PORT || 4555;

//Connect mongodb with config file 
mongoose.connect(config.database);

//successfull connection
mongoose.connection.on('connected', () => {
  console.log('connected to database' + config.database);
});

//on Error connection
mongoose.connection.on('error', (err) => {
  console.log('Failed to connect to  database' + err);
});

//CORS Middleware
app.use(cors());

app.use(bodyparser.urlencoded({
  extended: true
}))

//Enable CORS
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//Body parser middleware 
app.use(bodyparser.json());




app.post('/postAESLogDetails', (req, res, next) => {
  try {
    var AESToken = req.body.AESToken;
    if (AESToken != undefined && AESToken != null && AESToken != "") {
      var message = req.body.Message;
      var Date = req.body.Date;
      var CallLog = req.body.CallLog;
      var ObjIsCall = req.body.IsCall;
      var ObjIsSMS = req.body.IsSMS;
      var MobileNumber = req.body.MobileNumber;
      var ObjUserDetailsAESM = new UserdetailsM.UserDetailsAESM({
        AESToken: AESToken,
        Message: message,
        Date: Date,
        CallLog: CallLog,
        IsCall: ObjIsCall,
        IsSMS: ObjIsSMS,
        IsViewed: false,
        MobileNumber: MobileNumber
      });
      ObjUserDetailsAESM.save((mongoerr, success) => {
        if (mongoerr != null) res.json({
          success: false,
          msg: 'Not added',
          error: mongoerr
        });
        else {
          io.in(AESToken).emit('chat message', ObjUserDetailsAESM);
          res.json({
            success: true,
            msg: 'Added'
          });
        }

      });
    } else {
      res.json({
        success: false,
        msg: 'Required AES'
      });
    }
  } catch (Err) {
    Mailer(Err);
  }
});


io.on('connection', function (client) {
  try {
    console.log("New Connection: " + client.id + "  " + new Date());

    client.on('AESGroup', function (AESToken) {
      client.join(AESToken);
    });

    client.on('reply message', function (ExportMsg) {
      // console.log("Emitted data: msg: " + msg);
      var message = ExportMsg.Message;
      var Date = ExportMsg.Date;
      var MobileNumber = ExportMsg.MobileNumber
      var AESToken = ExportMsg.AESToken;
      var ObjUserDetailsAESM = {
        "AESToken": AESToken,
        "message": message,
        "MobileNumber": MobileNumber,
        "Date": Date
      };
      console.log("Emitted data: msg: " + JSON.stringify(ObjUserDetailsAESM));
      // if(socket.connected){
      io.emit('incoming text', ObjUserDetailsAESM);
      // }
    });

    client.on('disconnect', function () {
      console.log('client disconnect...', client.id + "  " + new Date());
    });
    client.on('error', function (err) {
      console.log('received error from client:', client.id)
      console.log(err)
    });
  } catch (Err) {
    Mailer(Err);

  }
});


app.use('/api', UserLogAPI);


app.get('/', function (req, res) {
  res.json({
    Status: 0
  });
});


http.listen(port, function () {
  console.log('listening on *:' + port);
});