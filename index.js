// index.js
const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware para manejar datos de formularios
app.use(bodyParser.urlencoded({ extended: false }));

// Ruta de prueba (para que Render no marque error en /health)
app.get("/health", (req, res) => {
  res.send("OK ✅");
});

// Webhook de Twilio (cuando llega un mensaje de WhatsApp)
app.post("/webhook", (req, res) => {
  const MessagingResponse = twilio.twiml.MessagingResponse;

  const twiml = new MessagingResponse();

  // Texto que envía el usuario
  const incomingMessage = req.body.Body;

  // Respuesta básica
  let reply = "Hola 👋 soy tu bot de WhatsApp, ya estoy funcionando 🚀";
  
  if (incomingMessage) {
    reply = `Me escribiste: "${incomingMessage}"`;
  }

  twiml.message(reply);

  res.type("text/xml");
  res.send(twiml.toString());
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
