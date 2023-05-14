import express, {Express} from 'express';
import acts from './acts';
import {Server} from 'socket.io';
import {User, Votes} from './types/User';
import http from 'http';
import Act from './types/Act';

const app: Express = express();
const server = http.createServer(app);
const io = new Server(server);

interface ClientToServerMessages {
    join: ( userId: string, username: string ) => void;
    rejoin: ( userId: string, username: string ) => void;
    vote: ( userId: string, msg: Votes ) => void;
}

interface ServerToClientMessages {
    "init-votes": (acts: {[p: number]: Act}) => void;
    "update-votes": (acts: {[p: number]: Act}) => void;
    "update-people": (people: string[]) => void;
    "init-scores": (votes: Votes) => void;
    "error": (msg: string) => void;
}

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

    const joinUser = (userId: string, username: string): void => {
        console.log(username + " joined (" + ((userId in users) ? 'familiar' : 'not familiar yet') + ")");

        if (userId in users) {
            users[userId].socketId = socket.id;
            users[userId].active = true;
            socket.emit("init-scores", users[userId].votes);
        } else {
            users[userId] = {socketId: socket.id, username: username, active: true, votes: {}};
        }

        io.sockets.emit("update-people", getPeople());
    }

    socket.on("join", joinUser);
    socket.on("rejoin", joinUser);

    socket.on("vote", (UserId, msg) => {
        console.log("vote", UserId, msg);

        getUser(UserId).votes = msg;
        calculateVotes();
        io.emit("update-votes", acts);
    });

    socket.on("disconnect", (reason) => {
        console.log("a user disconnected: " + reason + " (" + socket.id + ")");
        if (reason != "ping timeout") {
            const user = socketIdToUser(socket.id);
            if (user) {
                user.active = false;
                calculateVotes();
                io.sockets.emit("update-votes", acts);
                io.sockets.emit("update-people", getPeople());
            }
        }
        connections--;
        console.log("Connections: " + connections);
    });

    const getUser = (userId: string): User => {
        if (!(userId in users)) {
            socket.emit("error", "User unknown, please push the button clear username and votes");
            return {active: false, socketId: '?', username: '?', votes: undefined};
        }

        return users[userId];
    }
});

const socketIdToUser = (currentSocketId: string) => Object.values(users).find((user) => user.socketId == currentSocketId);

const getPeople = (): string[] => Object.values(users).filter(user => user.active).map(user => user.username);

const calculateVotes = () => {
    for (const actNumber in acts) {
        acts[actNumber].score = 0;
    }
    for (const user of Object.values(users)) {
        if (user.active) {
            for (const act in user.votes) {
                if (act in acts) {
                    if ("score" in acts[act]) {
                        acts[act].score += user.votes[act];
                    } else {
                        acts[act].score = user.votes[act];
                    }
                }
            }
        }
    }
}

server.listen(8000, function () {
    console.log('listening on *:8000');
});

calculateVotes();
setInterval(function () {
    if (connections > 0) {
        calculateVotes();
    }
}, 60000 * 5);
