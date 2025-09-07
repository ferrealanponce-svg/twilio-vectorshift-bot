import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Variables de entorno
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const pipelineId = process.env.PIPELINE_ID;
const vectorShiftApiKey = process.env.VECTORSHIFT_API_KEY;

const client = twilio(accountSid, authToken);

// Ruta principal
app.get("/", (req, res) => {
  res.send("✅ Bot de WhatsApp con Twilio + VectorShift está corriendo");
});

// Webhook de Twilio
app.post("/whatsapp", async (req, res) => {
  try {
    const incomingMsg = req.body.Body;
    const from = req.body.From;

    console.log("📩 Mensaje entrante:", incomingMsg, "de:", from);

    // Llamar al pipeline de VectorShift
    const response = await fetch(
      `https://api.vectorshift.ai/pipeline/${pipelineId}/run/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${vectorShiftApiKey}`,
        },
        body: JSON.stringify({
          input_data: { input_1: incomingMsg },
        }),
      }
    );

    const data = await response.json();
    console.log("📨 Respuesta VectorShift:", data);

    let reply = "⚠️ No entendí tu mensaje.";
    if (data && data.output && data.output.output_1) {
      reply = data.output.output_1;
    }

    // Responder por WhatsApp
    await client.messages.create({
      from: "whatsapp:+14155238886", // Número sandbox de Twilio
      to: from,
      body: reply,
    });

    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en webhook:", error);
    res.sendStatus(500);
  }
});

// Servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
