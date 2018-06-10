var app = require('express')();
const bodyparser = require('body-parser');
const cors = require('cors');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 4555;

// app.get('/', function(req, res){
//   res.sendFile(__dirname + '/index.html');
// });

//CORS Middleware
app.use(cors());

app.use(bodyparser.urlencoded({ extended: true }))

//Enable CORS
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//Body parser middleware 
app.use(bodyparser.json());


// app.get('/send', function(req, res){
//   let msg = req.query.msg;
//   io.emit('chat message', msg);  
//   res.json('done');
// });


app.post('/postAESLogDetails', (req, res, next) => {
  var AESToken = req.body.AESToken;
  if (AESToken != undefined && AESToken != null && AESToken != "") {
      var message = req.body.Message;
      var Date = req.body.Date;
      var CallLog = req.body.CallLog;
      var ObjIsCall = req.body.IsCall;
      var ObjIsSMS = req.body.IsSMS;
      var ObjUserDetailsAESM = {
        "AESToken": AESToken,
        "Message": message,
        "Date": Date,
        "CallLog": CallLog,
        "IsCall": ObjIsCall,
        "IsSMS": ObjIsSMS,
        "IsViewed": false
    };
      io.emit('chat message', ObjUserDetailsAESM);  
    
      res.json({ success: true, msg: 'Added'});
    }
});



// io.on('connection', function(socket){
//   console.log(socket);
//   socket.on('chat message', function(msg){
//     io.emit('chat message', msg);
//   });
// });

io.on('connection', function (client) {
  console.log("New Connection: "+ client.id + "  "+ new Date());
  // client.on('register', handleRegister)
  // client.on('join', handleJoin)
  // client.on('leave', handleLeave)
  // client.on('chat message', message(msg));

  client.on('chat message', function(msg){
    // console.log("Emitted data: msg: " + msg);
      var message = msg.Message;
      var Date = msg.Date;
      var AESToken = msg.AESToken;      
      var CallLog = msg.CallLog;
      var ObjIsCall = msg.IsCall;
      var ObjIsSMS = msg.IsSMS;
      var ObjUserDetailsAESM = {
        "AESToken": AESToken,
        "Message": message,
        "Date": Date,
        "CallLog": CallLog,
        "IsCall": ObjIsCall,
        "IsSMS": ObjIsSMS,
        "IsViewed": false
    };
    console.log("Emitted data: msg: " + JSON.stringify( ObjUserDetailsAESM));
    io.emit('incoming text', ObjUserDetailsAESM);
  });

  client.on('reply message', function(ExportMsg){
    // console.log("Emitted data: msg: " + msg);
      var message = ExportMsg.Message;
      var Date =ExportMsg.Date;
      var MobileNumber = ExportMsg.MobileNumber
      var AESToken = ExportMsg.AESToken;      
      var ObjUserDetailsAESM = {
        "AESToken": AESToken,
        "message":message,
        "MobileNumber":MobileNumber,
        "Date":Date
    };
    console.log("Emitted data: msg: " + JSON.stringify( ObjUserDetailsAESM));
    // if(socket.connected){
      io.emit('incoming text', ObjUserDetailsAESM);
    // }
  });


  // client.on('chatrooms', handleGetChatrooms)
  // client.on('availableUsers', handleGetAvailableUsers)
  client.on('disconnect', function () {
    console.log('client disconnect...', client.id + "  "+ new Date());
  });
  client.on('error', function (err) {
    console.log('received error from client:', client.id)
    console.log(err)
  });
});


app.get('/', function(req, res){  
  res.json({Status : 0});
});


http.listen(port, function(){
  console.log('listening on *:' + port);
});


// setInterval(function() {
//   http.get("https://socketnotifymeapi.herokuapp.com");
// }, 300000); // every 5 minutes (300000)