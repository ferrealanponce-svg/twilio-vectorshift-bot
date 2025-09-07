import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

app.post("/webhook", async (req, res) => {
  const incomingMessage = req.body.Body;
  const from = req.body.From;

  console.log("📩 Mensaje entrante:", incomingMessage);

  try {
    // Llamar a VectorShift con tu PIPELINE_ID y API_KEY
    const vsResp = await fetch(
      `https://api.vectorshift.ai/v1/pipeline/run/${process.env.PIPELINE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.VECTORSHIFT_API_KEY}`,
        },
        body: JSON.stringify({
          input_data: {
            input_1: incomingMessage,
          },
        }),
      }
    );

    const data = await vsResp.json();
    console.log("🤖 Respuesta VectorShift:", data);

    const reply = data.output.output_1 || "Lo siento, no entendí tu mensaje.";

    // Responder al usuario en WhatsApp
    await client.messages.create({
      body: reply,
      from: "whatsapp:+14155238886", // número sandbox Twilio
      to: from,
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error:", err);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${
