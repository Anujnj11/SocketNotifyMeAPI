var app = require('express')();
const bodyparser = require('body-parser');
const cors = require('cors');
var http = require('http').Server(app);
var io = require('socket.io')(http);
const mongoose = require('mongoose');
const Mailer = require('./Mailer.js');
const UserdetailsM = require('./Model/UserDetails.js');
const config = require('./config/Database.js');
const UserLogAPI = require('./API/UserAPI');


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


var ActiveConnection = [];
var MessageQue = [];

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


app.get('/getActiveConnection', (req, res) => {
  try {
    res.json({
      success: true,
      ActiveConnection: JSON.stringify(ActiveConnection),
      MessageQue : JSON.stringify(MessageQue)
    });
  } catch (err) {
    res.json({
      success: false,
      msg: 'Required AES'
    });
  }
});


io.on('connection', function (client) {
  try {

    console.log("New Connection: " + client.id + "  " + new Date());

    client.on('AESGroup', function (AESToken) {
      var ObjNewConnection = {};
      ObjNewConnection.Token = AESToken;
      ObjNewConnection.ClientId = client.id;
      ObjNewConnection.DateTime = new Date();
      ActiveConnection.push(ObjNewConnection);
      client.join(AESToken);
    });

    var tweets = setInterval(function () {
      // console.log('Inside Interval');
      // setQueMsg(function () {
        if (MessageQue.length > 0) {
          client.volatile.emit('lost message', MessageQue);
          MessageQue = [];
        }
      // });
    }, 5000);


    client.on('reply message', function (ExportMsg) {
      if (ExportMsg.AESToken != undefined && ExportMsg.AESToken != "") {
        var AESToken = ExportMsg.AESToken;
        var ObjMessageBodyReplyM = new UserdetailsM.MessageBodyReplyM({
          Date: ExportMsg.Date,
          AESToken: AESToken,
          MobileNumber: ExportMsg.MobileNumber,
          Message: ExportMsg.Message
        });
        ObjMessageBodyReplyM.save((mongoerr, success) => {
          if (mongoerr != null)
            res.json({
              success: false,
              msg: 'Not added',
              error: mongoerr
            });
          else {
            MessageQue.push(ObjMessageBodyReplyM);
            io.in(AESToken).emit('incoming text', ObjMessageBodyReplyM);
          }
        });
      }
    });

    client.on('disconnect', function () {
      console.log('client disconnect...', client.id + "  " + new Date());
      try {
        clearInterval(tweets);
        ActiveConnection.splice(ActiveConnection.indexOf(ActiveConnection.find(x => x.ClientId == client.id)), 1);
      } catch (err) {

      }
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