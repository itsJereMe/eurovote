import {io, Socket} from 'socket.io-client';
import {ClientToServerMessages, ServerToClientMessages} from '../types/SocketEvents';
import $ from 'jquery';
import 'jquery-ui/ui/widgets/sortable';
import 'jquery-ui/ui/disable-selection';
import '@rwap/jquery-ui-touch-punch';
import {Votes} from '../types/User';

const socket: Socket<ServerToClientMessages, ClientToServerMessages> = io();
const scoring: number[] = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];
const messages: HTMLElement = document.getElementById("msgs");
const voteTable: HTMLElement = document.querySelector("#vote tbody");

let username: string = "";
let UserId: string;

function join(name: string) {
    if (name !== "") {
        UserId = (document.cookie.indexOf("UserId=") >= 0) ? getCookie("UserId") : "UID" + socket.id;
        socket.emit("join", UserId, name);
        username = name;
        setCookie("UserId", UserId, 1);
        setCookie("UserName", username, 1);
        document.querySelector("#login").remove();
        (document.querySelector("#page2") as HTMLDivElement).style.display = "block";
    }
}

document.querySelector("#clearAll").addEventListener("click", () => {
    deleteAllCookies();
    location.reload();
});

document.querySelector("#loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    join((document.querySelector("#name") as HTMLInputElement).value);
});

const updateSortable = function () {
    const votes: Votes = {};

    document.querySelectorAll("#vote tbody > tr:not(.ui-state-disabled)").forEach(function (tr: HTMLTableRowElement, index) {
        if (index < scoring.length) {
            votes[tr.dataset.act] = scoring[index];
        }
    })

    console.log(votes);
    socket.emit("vote", UserId, votes);
}

socket.on("init-votes", (acts) => {
    if (username !== "") {
        console.log("rejoin");
        socket.emit("rejoin", UserId, username);
        updateSortable();
        return;
    }

    document.querySelector("#votable").innerHTML =
        Object.entries(acts).map(([key, act]) => "<tr class=\"bouger\" data-act=\"" + key + "\">\
                    <td>" + key + "</td>\
                    <td>" + act.country + "</td>\
                    <td>" + act.contestant + "</td>\
                    <td>" + act.song + "</td>\
                    <td class=\"dragger\">&#8597;</td>\
                </tr>").join('');

    $("#votable tbody").sortable({
        connectWith: ".votelist tbody",
        handle: 'td:last-child',
        dropOnEmpty: true,
        placeholder: "ui-state-highlight"
    }).disableSelection();

    $(voteTable).sortable({
        connectWith: ".votelist tbody",
        handle: 'td:last-child',
        dropOnEmpty: true,
        placeholder: "ui-state-highlight",
        items: "tr:not(.ui-state-disabled)",
        update: updateSortable
    }).disableSelection();

    if (document.cookie.indexOf("UserId=") >= 0) {
        console.log(getCookie("UserId"));
        join(getCookie("UserName"));
    }
});

socket.on("update-people", (people) => {
    document.getElementById("people").innerHTML = people.map(person => "<li>" + person + "</li>").join('');
});

socket.on("init-scores", (votes) => {
    console.log("init scores", votes);
    const voteList = Object.entries(votes).sort(([,a], [,b]) => b - a);

    for (const [actId] of voteList) {
        voteTable.appendChild(document.querySelector("#votable tr[data-act='" + actId + "']"));
    }

    updateSortable();
});

socket.on("disconnect", () => {
    messages.innerHTML = "Lost connection to the server";
});

socket.on("connect", () => {
    messages.innerHTML = "";
    console.log("established connection");
});

socket.on("error", (msg) => {
    messages.innerHTML = "Encountered an error: " + msg;
});

function setCookie(name: string, value: string, days: number) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(cname: string) {
    const name = cname + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function deleteAllCookies() {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}
