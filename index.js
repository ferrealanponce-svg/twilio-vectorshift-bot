// index.js
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (_req, res) => {
  res.send('OK ✅');
});

app.post('/webhook', async (req, res) => {
  const userText = (req.body && req.body.Body) ? String(req.body.Body) : '';

  let reply = 'Hola 👋, soy tu bot de WhatsApp funcionando 🚀';

  const { VECTORSIFT_API_KEY } = process.env;

  if (VECTORSIFT_API_KEY) {
    try {
      const VECTORSIFT_WEBHOOK_URL = "https://app.vectorshift.ai/api/v1/pipelines/68bce89d1d76fe15d037dd4b/run";

      const vsRes = await fetch(VECTORSIFT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': VECTORSIFT_API_KEY,
        },
        body: JSON.stringify({
          inputs: { input_1: userText }
        })
      });

      const data = await vsRes.json();

      if (typeof data === 'string') {
        reply = data;
      } else if (data && data.output_1) {
        reply = String(data.output_1);
      } else if (data && data.response) {
        reply = String(data.response);
      }
    } catch (err) {
      console.error('Error llamando a VectorShift:', err);
    }
  }

  const twiml = `<Response><Message>${escapeXML(reply)}</Message></Response>`;
  res.set('Content-Type', 'text/xml');
  res.send(twiml);
});

function escapeXML(s = '') {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
