// Start libraries and server
var express = require('express')
    , app = express();

var http = require('http')
    , server = http.createServer(app)
    , io = require('socket.io').listen(server);


// app config
app.configure(function() {
    // Views directory
    app.set('views', __dirname + '/views');
    // Static files directory
    app.use(express.static(__dirname + '/public'));
    // Disable layout
    app.set("view options", {layout: false});
    // Views engine
    app.set('view engine', 'jade');
});


// Render the main page
app.get('/', function(req, res) {
    res.render('chat.jade');
});


// Users nickname's
var nicknames = [];

// Connection event
io.sockets.on('connection', function(socket) {

    // Broadcast the message to all
    socket.on('message', function(data) {
        var userNickname = getNickname(socket);

        if (userNickname) {
            var transmit = {
                date: new Date().toISOString(),
                nickname: userNickname,
                message: data
            };

            socket.broadcast.emit('message', transmit);
            console.log('User %s said "%s"', transmit.nickname, data);
        }
    });

    // Set user nickname
    socket.on('setNickname', function(data) {
        // Test if nickname is already taken
        if (nicknames.indexOf(data) == -1) {
            socket.set('nickname', data, function() {
                nicknames.push(data);
                socket.emit('nickname', 'ok');

                emitOnlineUsers();
                console.log('User %s connected.', data);
            });
        } else {
            // Send the error
            socket.emit('nickname', 'error');
        }

        console.log(nicknames);
    });

    // Disconnection of the client
    // Remove the user's nickname
    socket.on('disconnect', function() {
        var userNickname = getNickname(socket);

        if (userNickname) {
            var index = nicknames.indexOf(userNickname);
            nicknames.splice(index, 1);

            emitOnlineUsers();
            console.log('User %s has been disconnected', userNickname);
        }

    });

});

/**
* Get the user nickname
*/
function getNickname(socket) {
    var nickname = false;

    socket.get('nickname', function(err, name) {
        if (name != null) {
            nickname = name;
        }
    });

    return nickname;
}

/**
* Emmit the 'online-users' evento to all clients
*/
function emitOnlineUsers() {
    io.sockets.emit('online-users', nicknames);
}


// Starts the server at port 3000
var port = Number(process.env.PORT || 5000);

server.listen(port, function() {
    console.log('Listening on port %d', server.address().port);
});
