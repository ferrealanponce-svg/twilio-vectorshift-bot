const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const fetch = require("node-fetch");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Variables de entorno (Render → Environment)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const vectorShiftApiKey = process.env.VECTORSHIFT_API_KEY;
const pipelineId = process.env.PIPELINE_ID;

const client = twilio(accountSid, authToken);

// Webhook de Twilio
app.post("/webhook", async (req, res) => {
  const incomingMsg = req.body.Body;
  const from = req.body.From;

  try {
    // 1. Llamada al pipeline de VectorShift
    const response = await fetch(`https://api.vectorshift.ai/v1/pipelines/${pipelineId}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${vectorShiftApiKey}`
      },
      body: JSON.stringify({
        input: { query: incomingMsg }
      })
    });

    const data = await response.json();
    const botReply = data.output || "Lo siento, no entendí tu mensaje.";

    // 2. Enviar respuesta a WhatsApp
    await client.messages.create({
      from: "whatsapp:+14155238886", // Número de Sandbox de Twilio
      to: from,
      body: botReply
    });

    res.status(200).send("OK");
  } catch (error) {
    console.error("Error en webhook:", error);
    res.status(500).send("Error en el servidor");
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

