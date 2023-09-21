import express from 'express';
import crypto from 'node:crypto'
import expressWs from 'express-ws'
import ChatRoom from './service/ChatRoom.mjs';
const app = express();

const expressWsInstant = expressWs(app);
const chatRoom = new ChatRoom();
app.get('/contacts', (req, res) => {
    res.send(chatRoom.getClients());
});
app.ws('/contacts/websocket', (ws, req) => {
    const clientName = ws.protocol || req.query.clientName;
    if (!clientName) {
        ws.send("must be client name");
        ws.close();
    } else {
        processConnection(clientName, ws);
    }
})
app.ws('/contacts/websocket/:clientName', (ws, req) => {
    const clientName = req.params.clientName;
   processConnection(clientName, ws);

})
app.listen(8080);
function processConnection(clientName, ws) {
    const connectionId = crypto.randomUUID();
    chatRoom.addConnection(clientName, connectionId, ws);
    ws.on('close', () => chatRoom.removeConnection(connectionId));
}

