// centralserver.js

const WebSocket = require('ws');
const express = require('express');
const crypto = require('crypto');
const http = require('http');
var cors = require('cors')

const app = express();
app.use(cors())
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let blockchain = [];
let sockets = []; 

wss.on('connection', (ws) => {
    sockets.push(ws);
    console.log('Miner connected');
    broadcastMinerCount();

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        handleMessage(data, ws);
    });

    ws.on('close', () => {
        sockets = sockets.filter(s => s !== ws);
        console.log('Miner disconnected');
        broadcastMinerCount();
    });
});

function handleMessage(data, ws) {
    switch (data.type) {
        case 'NEW_BLOCK':
            if (isValidBlock(data.block)) {
                blockchain.push(data.block);
                broadcast({ type: 'BLOCKCHAIN', blockchain });
                console.log('New Block Added:', data.block);
            }
            break;
        case 'REQUEST_BLOCKCHAIN':
            ws.send(JSON.stringify({ type: 'BLOCKCHAIN', blockchain }));
            break;
        case 'TRANSACTION':
            // Broadcast the transaction to all connected miners
            broadcast({ type: 'NEW_TRANSACTION', transaction: data.transaction });
            break;
    }
}


function broadcast(message) {
    sockets.forEach(socket => socket.send(JSON.stringify(message)));
}

function broadcastMinerCount() {
    const minerCount = sockets.length;
    broadcast({ type: 'MINER_COUNT', minerCount });
}

function isValidBlock(block) {
    const previousBlock = blockchain[blockchain.length - 1];
    if (previousBlock && block.previousHash !== previousBlock.hash) {
        return false;
    }
    if (calculateHash(block) !== block.hash) {
        return false;
    }
    if (block.proofOfWork !== calculateProofOfWork(block)) {
        return false;
    }
    return true;
}

function calculateHash(block) {
    return crypto.createHash('sha256').update(JSON.stringify(block)).digest('hex');
}

function calculateProofOfWork(block) {
    // Simple proof of work: hash should start with '0000'
    return block.hash.startsWith('0000') ? block.hash : '';
}

server.listen(3000, () => {
    console.log('Central server listening on port 3000');
});
