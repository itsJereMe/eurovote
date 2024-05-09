import {Socket} from 'socket.io';
import {ClientToServerMessages, ServerToClientMessages} from './SocketEvents';

type TypedSocket = Socket<ClientToServerMessages, ServerToClientMessages>;
export default TypedSocket;
