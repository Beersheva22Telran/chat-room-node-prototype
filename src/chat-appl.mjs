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
    ws.on('message', processMessage.bind(undefined, clientName, ws))
}
function processMessage(clientName, ws, message) {
    try {
        const messageObj = JSON.parse(message.toString())
        const to = messageObj.to;
        const text = messageObj.text;
        if (!text) {
            ws.send("your message doesn't contain text")
        } else {
            const objSent = JSON.stringify({from: clientName, text});
            if (!to || to === 'all') {
                sendAll(objSent);
            } else {
                sendClient(objSent, to, ws);
            }
        }

    } catch (error) {
        ws.send('wrong message structure')
    }
}
function sendAll(message) {
    chatRoom.getAllWebsockets().forEach(ws => ws.send(message));
}
function sendClient(message, client, socketFrom) {
    const clientSockets = chatRoom.getClientWebsockets(client);
    if(clientSockets.length == 0) {
        socketFrom.send(client + " contact doen't exist")
    } else {
        clientSockets.forEach(s => s.send(message))
    }
}

