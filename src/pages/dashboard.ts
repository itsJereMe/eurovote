import {io, Socket} from 'socket.io-client';
import {ClientToServerMessages, ServerToClientMessages} from '../types/SocketEvents';
import Act from '../types/Act';
import countryCodes from '../assets/script/countries';

const socket: Socket<ServerToClientMessages, ClientToServerMessages> = io();

let actList: { [p: number]: Act };

socket.on("init-votes", (acts) => {
    actList = acts;

    document.querySelector(".votes").innerHTML =
        rankedActs()
            .map(([key, act], index) => "<tr data-act='" + key + "' data-score='" + act.score + "' data-ranking='" + index + "'>\
                    <td style='background: url(" + getFlagImage(act.country) + ")'></td>\
                    <td><progress value='" + act.score + "'></progress><span>" + act.country + "</span></td>\
                    <td>" + act.score + "</td>\
                </tr>").join('');

    updateHighestScore();
    positionRows();
});

const getFlagImage = (countryName: string) => {
    if (!countryCodes.hasOwnProperty(countryName)) {
        return '';
    }

    return '/assets/img/flags/' + countryCodes[countryName].toLowerCase() + '.svg'
}

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
        const leftRowSize = Math.ceil(Object.keys(actList).length / 2);
        const rowHeight = 68;
        let top = ranking * rowHeight;
        let left = 0;

        if (ranking >= leftRowSize) {
            top = (ranking - leftRowSize) * rowHeight
            left = 50.5;
        }

        element.style.top = top + 'px';
        element.style.left = left + '%';
        console.log(ranking, leftRowSize);
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
