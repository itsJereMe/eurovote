import express, {Express} from 'express';
import {Server} from 'socket.io';
import http from 'http';
import webpackDevMiddleware from 'webpack-dev-middleware';
import {webpack} from 'webpack';
import {ClientToServerMessages, ServerToClientMessages} from './types/SocketEvents';
import webpackConfig from "../webpack.config";
import SocketSession from './SocketSession';

const app: Express = express();
const server = http.createServer(app);
const compiler = webpack(webpackConfig);
const io = new Server<ClientToServerMessages, ServerToClientMessages>(server);
const socketSession = new SocketSession(io);

app.use(webpackDevMiddleware(compiler, {publicPath: webpackConfig.output.publicPath}));

app.get('/', (_req, res) => {
    res.sendFile(__dirname + '/templates/index.html');
});

app.get('/dashboard', (_req, res) => {
    res.sendFile(__dirname + '/templates/dashboard.html');
});

app.use('/assets', express.static(__dirname + '/assets', {maxAge: 60 * 60 * 24}));

io.on('connection', socketSession.onConnection);

server.listen(8000, function () {
    console.log('listening on *:8000');
});
