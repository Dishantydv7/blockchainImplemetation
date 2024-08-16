const WebSocket = require('ws');
const crypto = require('crypto');

const ws = new WebSocket('ws://localhost:3000');

let blockchain = [];

// Connect to the central server
ws.on('open', () => {
    console.log('Connected to central server');
    ws.send(JSON.stringify({ type: 'REQUEST_BLOCKCHAIN' }));
});


ws.on('message', (message) => {
    const data = JSON.parse(message);
    handleMessage(data);
});

// Handle different types of types of messg
function handleMessage(data) {
    switch (data.type) {
        case 'BLOCKCHAIN':
            blockchain = data.blockchain;
            console.log('Received Blockchain:', blockchain);
            break;
        case 'MINER_COUNT':
            console.log(`Number of miners connected: ${data.minerCount}`);
            break;
        case 'NEW_TRANSACTION':
            console.log('Received New Transaction:', data.transaction);
            // Create and broadcast a new block with the transaction
            const newBlock = createBlock([data.transaction]);
            broadcastBlock(newBlock);
            console.log('New Block Created:', newBlock);
            break;
    }
}

// Create a new block
function createBlock(transactions) {
    const previousBlock = blockchain[blockchain.length - 1];
    const previousHash = previousBlock ? previousBlock.hash : '0';
    const block = {
        index: blockchain.length,
        timestamp: Date.now(),
        transactions,
        previousHash,
        nonce: 0,
        proofOfWork: '', 
    };

    block.hash = mineBlock(block);
    block.proofOfWork = block.hash; // Include proof of work in block
    return block;
}

// Mine a block by finding a valid hash
function mineBlock(block) {
    while (true) {
        block.nonce++;
        const hash = calculateHash(block);
        if (hash.startsWith('0000')) {
            return hash;
        }
    }
}

// Calculate the hash 
function calculateHash(block) {
    return crypto.createHash('sha256').update(JSON.stringify(block)).digest('hex');
}

// Broadcast the block on the central 
function broadcastBlock(block) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'NEW_BLOCK', block }));
    } else {
        console.error('WebSocket is not open. Cannot broadcast block.');
    }
}

