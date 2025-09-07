const express = require("express");
const bodyParser = require("body-parser");
const MessagingResponse = require("twilio").twiml.MessagingResponse;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// 🔹 Memoria en memoria RAM (simple)
let conversations = {};

app.post("/webhook", (req, res) => {
  const twiml = new MessagingResponse();
  const from = req.body.From;  // número del usuario
  const incomingMsg = req.body.Body;

  // Si no hay historial, lo iniciamos
  if (!conversations[from]) {
    conversations[from] = [];
  }

  // Guardamos el mensaje en el historial
  conversations[from].push({ role: "user", content: incomingMsg });

  // 🔹 Aquí inventamos una respuesta básica usando el historial
  let respuesta = "🤖 Historial de tu conversación:\n";
  conversations[from].forEach((msg, i) => {
    respuesta += `${i + 1}. (${msg.role}) ${msg.content}\n`;
  });

  respuesta += "\n(Estoy recordando lo que me dices 😉)";

  // Respondemos en WhatsApp
  twiml.message(respuesta);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
