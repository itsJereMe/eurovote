import {Votes} from './User';
import Act from './Act';

export interface ClientToServerMessages {
    join: ( userId: string, username: string ) => void;
    rejoin: ( userId: string, username: string ) => void;
    vote: ( userId: string, msg: Votes ) => void;
}

export interface ServerToClientMessages {
    "init-votes": (acts: {[p: number]: Act}) => void;
    "update-votes": (acts: {[p: number]: Act}) => void;
    "update-people": (people: string[]) => void;
    "init-scores": (votes: Votes) => void;
    "error": (msg: string) => void;
}
