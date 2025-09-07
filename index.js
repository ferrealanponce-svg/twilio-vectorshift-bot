const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));

// Ruta principal (para probar en navegador)
app.get('/', (req, res) => {
  res.send('Servidor funcionando 🚀');
});

// Ruta Webhook de Twilio
app.post('/webhook', (req, res) => {
  const twiml = `
    <Response>
      <Message>Hola 👋, soy tu bot de WhatsApp funcionando 🚀</Message>
    </Response>
  `;
  res.set('Content-Type', 'text/xml');
  res.send(twiml);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
