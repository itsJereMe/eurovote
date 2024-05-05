import {io, Socket} from 'socket.io-client';
import {ClientToServerMessages, ServerToClientMessages} from '../types/SocketEvents';
import Act from '../types/Act';

const socket: Socket<ServerToClientMessages, ClientToServerMessages> = io();

let actList: { [p: number]: Act };

socket.on("init-votes", (acts) => {
    actList = acts;

    document.querySelector(".votes").innerHTML =
        rankedActs()
            .map(([key, act], index) => "<tr data-act='" + key + "' data-score='" + act.score + "' data-ranking='" + index + "'>\
                    <td>" + key + "</td>\
                    <td><progress value='" + act.score + "'></progress>" + act.country + "</td>\
                    <td>" + act.score + "</td>\
                </tr>").join('');

    updateHighestScore();
    positionRows();
});

socket.on("update-votes", (acts) => {
    actList = acts;

    rankedActs().forEach(([key, value], index) => {
        const rowElement: HTMLProgressElement = document.querySelector(".votes tr[data-act='" + key + "']");
        rowElement.dataset.ranking = index.toString();
        rowElement.dataset.score = value.score.toString();
        (rowElement.querySelector('td:last-child') as HTMLElement).innerText = value.score.toString();
        (rowElement.querySelector('progress') as HTMLProgressElement).value = value.score;
    });

    updateHighestScore();
    positionRows();
});

const positionRows = () => {
    document.querySelectorAll(".votes tr").forEach((element: HTMLElement) => {
        const ranking = Number.parseInt(element.dataset.ranking);
        const leftRowSize = Math.floor(Object.keys(actList).length / 2);
        const rowHeight = 64;
        let top = ranking * rowHeight;
        let left = 0;

        if (ranking > leftRowSize) {
            top = (ranking - leftRowSize - 1) * rowHeight
            left = 50.5;
        }

        element.style.top = top + 'px';
        element.style.left = left + '%';
    })
}

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

const rankedActs = () => Object.entries(actList).sort(([, actA], [, actB]) => actB.score - actA.score);
