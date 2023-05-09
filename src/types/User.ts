export interface User {
    socketId: string;
    username: string;
    active: boolean;
    votes: Votes;
}

type Votes = {[id: string]: number}
