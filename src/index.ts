import express, {Express} from 'express';
import acts from './acts';
import socketIo from 'socket.io';
import {User} from './types/User';

const app: Express = express();
const http = require('http').Server(app);
const io = socketIo(http);

let connections = 0;
const users: {[id: string]: User} = {};

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/templates/index.html');
});

app.get('/dashboard', function (req, res) {
    res.sendFile(__dirname + '/templates/dashboard.html');
});

app.use('/assets', express.static(__dirname + '/assets'))

io.on('connection', function (socket) {
    socket.emit("init-votes", acts);
    io.sockets.emit("update-people", getPeople());
    console.log(getPeople());
    connections++;
    console.log("Connections: " + connections + " (+" + socket.id + ")");

    const joinUser = (userId, username) => {
        console.log(username + " joined (" + ((userId in users) ? 'familiar' : 'not familiar yet') + ")");

        if (userId in users) {
            users[userId].socketId = socket.id;
            users[userId].active = true;
            io.sockets.emit("init-scores", users[userId]["votes"]);
        } else {
            users[userId] = {socketId: socket.id, username: username, active: true, votes: {}};
        }

        io.sockets.emit("update-people", getPeople());
    }

    socket.on("join", joinUser);
    socket.on("rejoin", joinUser);

    socket.on("vote", (UserId, msg) => {
        users[UserId]["votes"] = msg;
        calculateVotes();
        io.emit("update-votes", acts);
    });

    socket.on("disconnect", (reason) => {
        console.log("a user disconnected: " + reason + " (" + socket.id + ")");
        if (reason != "ping timeout") {
            const userId = socketIdToUserId(socket.id);
            if (userId) {
                users[userId].active = false;
                calculateVotes();
                io.sockets.emit("update-votes", acts);
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
    for (const act in acts) {
        acts[act]["score"] = 0;
    }
    for (const voter in users) {
        if (users[voter].active) {
            for (const act in users[voter]["votes"]) {
                if (act in acts) {
                    if ("score" in acts[act]) {
                        acts[act]["score"] += users[voter]["votes"][act];
                    } else {
                        acts[act]["score"] = users[voter]["votes"][act];
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
