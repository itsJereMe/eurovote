const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
var connections = 0;
var Users = {};
const actlist = require("./acts");

getJSON();
setInterval(function () {
    if (connections > 0) {
        getJSON();
    }
}, 60000 * 5);

function getJSON() {
    calculateVotes();
}

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/dashboard', function (req, res) {
    res.sendFile(__dirname + '/dashboard.html');
});
app.get('/bg.jpg', function (req, res) {
    res.sendFile(__dirname + '/bg.jpg');
});

io.on('connection', function (socket) {
    socket.emit("init-votes", actlist);
    io.sockets.emit("update-people", People());
    console.log(People());
    connections++;
    console.log("Connections: " + connections + " (+" + socket.id + ")");

    socket.on("join", function (UserId, username) {
        console.log(username + " joined");

        if (UserId in Users) {
            console.log("we know you");
            Users[UserId].socketid = socket.id;
            Users[UserId].active = true;
            io.sockets.emit("init-scores", Users[UserId]["votes"]);
        } else {
            Users[UserId] = {socketid: socket.id, username: username, active: true, votes: {}};
        }

        io.sockets.emit("update-people", People());
    });
    socket.on("rejoin", function (UserId, username, oldid) {
        console.log(username + " joined again");
        if (UserId in Users) {
            Users[UserId].socketid = socket.id;
            Users[UserId].active = true;
        } else {
            console.log("could not find old session id in array");
            Users[UserId] = {socketid: socket.id, username: username, active: true, votes: {}};
        }
        io.sockets.emit("update-people", People());
    });
    socket.on("vote", function (UserId, msg) {
        Users[UserId]["votes"] = msg;
        calculateVotes();
        io.emit("update-votes", actlist);
    });
    socket.on("disconnect", function (reason) {
        console.log("a user disconnected: " + reason + " (" + socket.id + ")");
        if (reason != "ping timeout") {
            if (socketidToUserId(socket.id) != false) {
                Users[socketidToUserId(socket.id)].active = false;
                calculateVotes();
                io.sockets.emit("update-votes", actlist);
                io.sockets.emit("update-people", People());
            }
        }
        connections--;
        console.log("Connections: " + connections);
    });
});

function socketidToUserId(currentsocketid) {
    for (voter in Users) {
        if (Users[voter].socketid == currentsocketid) {
            return voter;
        }
    }
    return false;
}

function People() {
    var result = [];
    console.log(Users);
    for (voter in Users) {
        if (Users[voter].active)
            result.push(Users[voter].username);
    }
    return result;
}

function calculateVotes() {
    for (act in actlist) {
        actlist[act]["score"] = 0;
    }
    for (voter in Users) {
        if (Users[voter].active) {
            for (act in Users[voter]["votes"]) {
                if (act in actlist) {
                    if ("score" in actlist[act]) {
                        actlist[act]["score"] += Users[voter]["votes"][act];
                    } else {
                        actlist[act]["score"] = Users[voter]["votes"][act];
                    }
                }
            }
        }
    }
}

http.listen(8000, function () {
    console.log('listening on *:8000');
});