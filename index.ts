import express, {Express} from 'express';
import actlist from './acts';
import socketIo from 'socket.io';
import {User} from './User';

const app: Express = express();
const http = require('http').Server(app);
const io = socketIo(http);

let connections = 0;
const users: {[id: string]: User} = {};

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
    io.sockets.emit("update-people", getPeople());
    console.log(getPeople());
    connections++;
    console.log("Connections: " + connections + " (+" + socket.id + ")");

    socket.on("join", (UserId, username) => {
        console.log(username + " joined");

        if (UserId in users) {
            console.log("we know you");
            users[UserId].socketId = socket.id;
            users[UserId].active = true;
            io.sockets.emit("init-scores", users[UserId]["votes"]);
        } else {
            users[UserId] = {socketId: socket.id, username: username, active: true, votes: {}};
        }

        io.sockets.emit("update-people", getPeople());
    });

    socket.on("rejoin", (UserId, username, _) => {
        console.log(username + " joined again");
        if (UserId in users) {
            users[UserId].socketId = socket.id;
            users[UserId].active = true;
        } else {
            console.log("could not find old session id in array");
            users[UserId] = {socketId: socket.id, username: username, active: true, votes: {}};
        }
        io.sockets.emit("update-people", getPeople());
    });

    socket.on("vote", (UserId, msg) => {
        users[UserId]["votes"] = msg;
        calculateVotes();
        io.emit("update-votes", actlist);
    });

    socket.on("disconnect", (reason) => {
        console.log("a user disconnected: " + reason + " (" + socket.id + ")");
        if (reason != "ping timeout") {
            const userId = socketIdToUserId(socket.id);
            if (userId != false) {
                users[userId].active = false;
                calculateVotes();
                io.sockets.emit("update-votes", actlist);
                io.sockets.emit("update-people", getPeople());
            }
        }
        connections--;
        console.log("Connections: " + connections);
    });
});

const socketIdToUserId = (currentSocketId: string) => {
    for (const voter in users) {
        if (users[voter].socketId == currentSocketId) {
            return voter;
        }
    }
    return false;
}

const getPeople = () => {
    const result = [];
    console.log(users);
    for (const voter in users) {
        if (users[voter].active)
            result.push(users[voter].username);
    }
    return result;
}

const calculateVotes = () => {
    for (const act in actlist) {
        actlist[act]["score"] = 0;
    }
    for (const voter in users) {
        if (users[voter].active) {
            for (const act in users[voter]["votes"]) {
                if (act in actlist) {
                    if ("score" in actlist[act]) {
                        actlist[act]["score"] += users[voter]["votes"][act];
                    } else {
                        actlist[act]["score"] = users[voter]["votes"][act];
                    }
                }
            }
        }
    }
}

http.listen(8000, function () {
    console.log('listening on *:8000');
});

calculateVotes();
setInterval(function () {
    if (connections > 0) {
        calculateVotes();
    }
}, 60000 * 5);
