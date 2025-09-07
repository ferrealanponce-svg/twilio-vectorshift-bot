import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Twilio config
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Memoria simple en memoria del servidor
let conversationHistory = {};

// Endpoint para recibir mensajes de WhatsApp
app.post("/whatsapp", async (req, res) => {
  try {
    const from = req.body.From; // número del usuario
    const body = req.body.Body?.trim() || ""; // mensaje de usuario

    if (!from || !body) {
      return res.status(400).send("Invalid request");
    }

    // Inicializar historial si no existe
    if (!conversationHistory[from]) {
      conversationHistory[from] = [];
    }

    // Guardar mensaje del usuario en historial
    conversationHistory[from].push({ role: "user", content: body });

    // Enviar mensaje + historial a VectorShift
    const response = await fetch(process.env.VECTORSHIFT_PIPELINE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.VECTORSHIFT_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: body,
        history: conversationHistory[from]
      })
    });

    const data = await response.json();

    let reply = "Lo siento, no entendí.";
    if (data && data.output) {
      reply = data.output;
    }

    // Guardar respuesta del bot en historial
    conversationHistory[from].push({ role: "assistant", content: reply });

    // Responder al usuario por WhatsApp
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: from,
      body: reply
    });

    res.send("OK");
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Server error");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
