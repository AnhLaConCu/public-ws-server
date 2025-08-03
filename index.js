const WebSocket = require('ws');
const http = require('http');
const axios = require('axios');

const PORT = process.env.PORT || 10000;
const API_URL = 'https://saobody-lopq.onrender.com/api/taixiu/sunwin';

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('WebSocket Server is running');
});

const wss = new WebSocket.Server({ server, path: '/ws' });

let clients = [];

wss.on('connection', (ws, req) => {
  console.log('Client connected');
  clients.push(ws);

  ws.on('close', () => {
    console.log('Client disconnected');
    clients = clients.filter((client) => client !== ws);
  });
});

async function fetchDataAndBroadcast() {
  try {
    const { data } = await axios.get(API_URL);

    if (Array.isArray(data) && data.length > 0) {
      const latest = data[0];
      const payload = {
        phien: latest.session,
        xuc_xac_1: latest.dice[0],
        xuc_xac_2: latest.dice[1],
        xuc_xac_3: latest.dice[2],
        tong: latest.total,
        ket_qua: latest.result
      };

      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(payload));
        }
      });

      console.log('Broadcast:', payload);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

setInterval(fetchDataAndBroadcast, 3000);

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
