const WebSocket = require('ws');
const axios = require('axios');

const PORT = process.env.PORT || 8080;
const API_URL = 'https://saobody-lopq.onrender.com/api/taixiu/sunwin';

const wss = new WebSocket.Server({ port: PORT });

let clients = [];

wss.on('connection', (ws, req) => {
  const urlParams = new URLSearchParams(req.url.slice(1)); // skip "/"
  const id = urlParams.get('id') || 'UnknownID';
  const key = urlParams.get('key') || 'NoKey';
  console.log(`Client connected - ID: ${id}, Key: ${key}`);

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

console.log(`WebSocket Server is running on PORT: ${PORT}`);