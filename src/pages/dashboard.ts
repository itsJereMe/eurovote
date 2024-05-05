import {io, Socket} from 'socket.io-client';
import {ClientToServerMessages, ServerToClientMessages} from '../types/SocketEvents';
import Act from '../types/Act';

const socket: Socket<ServerToClientMessages, ClientToServerMessages> = io();

let actList: { [p: number]: Act };

socket.on("init-votes", (acts) => {
    actList = acts;

    document.querySelector(".votes").innerHTML =
        Object.entries(actList).map(([key, act]) => "<tr>\
                    <td>" + key + "</td>\
                    <td>" + act.country + "</td>\
                    <td>" + act.contestant + "</td>\
                    <td>" + act.song + "</td>\
                    <td><progress value='" + act.score + "' data-act='" + key + "'></progress></td>\
                </tr>").join('');

    updateHighestScore();
});

socket.on("update-votes", (acts) => {
    actList = acts;

    for (const [key, act] of Object.entries(actList)) {
        const element: HTMLProgressElement = document.querySelector(".votes progress[data-act='" + key + "']");
        element.value = act.score;
    }

    updateHighestScore();
});

socket.on("update-people", (people) => {
    document.getElementById("people").innerHTML = people.map(person => "<li>" + person + "</li>").join('');
});

const updateHighestScore = () => {
    const highestScore = findHighestScore();
    document.querySelectorAll('.votes progress').forEach((element) => {
        element.setAttribute("max", highestScore.toString());
    });
};

const findHighestScore = () => Math.max(...Object.values(actList).map(act => act.score));
