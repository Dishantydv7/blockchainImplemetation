import React, { useState, useEffect } from 'react';
import EC from 'elliptic';
import './App.css';

// Initialize elliptic curve
const ec = new EC.ec('secp256k1');

function App() {
  const [wallet, setWallet] = useState(null);
  const [transaction, setTransaction] = useState({ from: '', to: '', amount: 0 });
  const [signedTransaction, setSignedTransaction] = useState(null);
  const [status, setStatus] = useState('');
  const [blockchain, setBlockchain] = useState([]);

  // Create a new wallet (public/private key pair)
  const createWallet = () => {
    const keyPair = ec.genKeyPair();
    const privateKey = keyPair.getPrivate('hex');
    const publicKey = keyPair.getPublic('hex');

    setWallet({ privateKey, publicKey });
    setStatus('Wallet created successfully!');
  };

  // Handle transaction input changes
  const handleTransactionChange = (e) => {
    const { name, value } = e.target;
    setTransaction((prev) => ({ ...prev, [name]: value }));
  };

  // Sign the transaction using the private key
  const signTransaction = () => {
    if (!wallet) {
      setStatus('Create a wallet first!');
      return;
    }

    const { privateKey } = wallet;
    const transactionData = JSON.stringify(transaction);
    const keyPair = ec.keyFromPrivate(privateKey);
    const signature = keyPair.sign(transactionData).toDER('hex');

    setSignedTransaction({ ...transaction, signature });
    setStatus('Transaction signed successfully!');
  };

  // Send the signed transaction to the central server
  const sendTransaction = () => {
    if (!signedTransaction) {
      setStatus('Sign the transaction first!');
      return;
    }

    fetch('http://localhost:3000/transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signedTransaction),
    })
      .then((response) => response.json())
      .then((data) => {
        setStatus('Transaction sent successfully!');
      })
      .catch((error) => {
        console.error('Error:', error);
        setStatus('Failed to send transaction.');
      });
  };

  // Fetch blockchain from the central server
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'REQUEST_BLOCKCHAIN' }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'BLOCKCHAIN') {
        setBlockchain(data.blockchain);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="App">
      <h1>BTC Wallet</h1>
      <button onClick={createWallet}>Create Wallet</button>

      {wallet && (
        <div>
          <h2>Your Wallet</h2>
          <p><strong>Public Key:</strong> {wallet.publicKey}</p>
          <p><strong>Private Key:</strong> {wallet.privateKey}</p>
        </div>
      )}

      <h2>Create Transaction</h2>
      <input
        type="text"
        name="from"
        placeholder="From"
        value={transaction.from}
        onChange={handleTransactionChange}
      />
      <input
        type="text"
        name="to"
        placeholder="To"
        value={transaction.to}
        onChange={handleTransactionChange}
      />
      <input
        type="number"
        name="amount"
        placeholder="Amount"
        value={transaction.amount}
        onChange={handleTransactionChange}
      />
      <button onClick={signTransaction}>Sign Transaction</button>

      {signedTransaction && (
        <div>
          <h2>Signed Transaction</h2>
          <pre>{JSON.stringify(signedTransaction, null, 2)}</pre>
          <button onClick={sendTransaction}>Send Transaction</button>
        </div>
      )}

      <h2>Blockchain</h2>
      <ul>
        {blockchain.map((block, index) => (
          <li key={index}>
            <strong>Block #{block.index}</strong>
            <p>Previous Hash: {block.previousHash}</p>
            <p>Hash: {block.hash}</p>
            <p>Proof of Work: {block.proofOfWork}</p>
            <p>Transactions: {JSON.stringify(block.transactions)}</p>
            <p>Nonce: {block.nonce}</p>
            <p>Timestamp: {new Date(block.timestamp).toLocaleString()}</p>
          </li>
        ))}
      </ul>

      <p>{status}</p>
    </div>
  );
}

export default App;
