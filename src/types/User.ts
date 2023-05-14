export interface User {
    socketId: string;
    username: string;
    active: boolean;
    votes: Votes;
}

export type Votes = {[id: string]: number}
