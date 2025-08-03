const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ noServer: true });

let clients = [];

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const id = url.searchParams.get('id');
  const key = url.searchParams.get('key');
  console.log(`Client connected: id=${id}, key=${key}`);
  clients.push(ws);

  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
  });
});

async function broadcast() {
  try {
    const { data } = await axios.get('https://saobody-lopq.onrender.com/api/taixiu/sunwin');
    if (Array.isArray(data) && data.length) {
      const latest = data[0];
      const payload = {
        phien: latest.session,
        xuc_xac_1: latest.dice[0],
        xuc_xac_2: latest.dice[1],
        xuc_xac_3: latest.dice[2],
        tong: latest.total,
        ket_qua: latest.result
      };
      clients.forEach(c => {
        if (c.readyState === WebSocket.OPEN) c.send(JSON.stringify(payload));
      });
      console.log('Broadcast:', payload);
    }
  } catch (e) {
    console.error('Fetch error', e);
  }
}

setInterval(broadcast, 3000);

app.get('/', (_req, res) => res.send('WebSocket server is running'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
