import acts from './acts';
import {ClientToServerMessages, ServerToClientMessages} from './types/SocketEvents';
import {User} from './types/User';
import {Server} from 'socket.io';
import TypedSocket from './types/TypedSocket';
import {EventNames, EventParams} from 'socket.io/dist/typed-events';

export default class SocketSession {

    users: {[userId: string]: User} = {};

    io: Server<ClientToServerMessages, ServerToClientMessages>;

    constructor(io: Server<ClientToServerMessages, ServerToClientMessages>) {
        this.io = io;
        this.calculateVotes();
    }

    onConnection = (socket: TypedSocket) => {
        console.log("Client connected (" + socket.id + ")");
        socket.emit("init-votes", acts);
        socket.emit("update-people", this.getPeople());

        socket.on("join", (userId, username) => this.joinUser(socket, userId, username));
        socket.on("rejoin", (userId, username) => this.joinUser(socket, userId, username));

        socket.on("vote", (UserId, userVotes) => {
            const user = this.getUserByUserId(UserId);
            console.log("Vote", user.username, userVotes);

            if (!user) {
                return;
            }

            user.votes = userVotes;
            this.calculateVotes();
        });

        socket.on("logout", (userId) => {
            console.log('Log out ', userId)
            if (!(userId in this.users)) {
                return;
            }

            delete this.users[userId];

            this.calculateVotes();
            this.emitToAll("update-people", this.getPeople());
        });

        socket.on("disconnect", (reason) => {
            console.log("Client disconnected: " + reason + " (" + socket.id + ")");
            if (reason != "ping timeout") {
                const user = this.socketIdToUser(socket.id);
                if (user) {
                    user.active = false;
                    this.calculateVotes();
                }
            }
        });
    }

    joinUser = (socket: TypedSocket, userId: string, username: string) => {
        console.log(username + " joined (" + ((userId in this.users) ? 'familiar' : 'not familiar yet') + ")");

        if (userId in this.users) {
            this.users[userId].socketId = socket.id;
            this.users[userId].active = true;
            socket.emit("init-scores", this.users[userId].votes);
        } else {
            this.users[userId] = {socketId: socket.id, username: username, active: true, votes: {}};
        }

        this.emitToAll("update-people", this.getPeople())
    }

    getUserByUserId: (userId: string) => User|undefined = (userId) => {
        if (!(userId in this.users)) {
            return undefined;
        }

        return this.users[userId];
    }

    socketIdToUser = (currentSocketId: string) => Object.values(this.users).find((user) => user.socketId == currentSocketId);

    getPeople = (): string[] => Object.values(this.users).map(user => user.username);

    calculateVotes = () => {
        for (const actNumber in acts) {
            acts[actNumber].score = 0;
        }

        for (const user of Object.values(this.users)) {
            for (const act in user.votes) {
                if (act in acts) {
                    acts[act].score += user.votes[act];
                }
            }
        }

        this.emitToAll("update-votes", acts);
    }

    emitToAll: <Ev extends EventNames<ServerToClientMessages>>(ev: Ev, ...args: EventParams<ServerToClientMessages, Ev>) => boolean = (ev, ...args) => {
        return this.io.emit(ev, ...args);
    }

}
