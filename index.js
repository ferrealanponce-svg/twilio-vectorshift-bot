import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = process.env.PORT || 10000;
const PIPELINE_ID = process.env.PIPELINE_ID;
const VECTORSHIFT_API_KEY = process.env.VECTORSHIFT_API_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Endpoint para recibir mensajes de WhatsApp
app.post("/webhook", async (req, res) => {
  const incomingMsg = req.body.Body;
  const from = req.body.From;

  console.log("Mensaje entrante:", incomingMsg);

  let reply = "Lo siento, hubo un problema procesando tu mensaje 🙏.";

  try {
    const response = await fetch(
      `https://api.vectorshift.ai/pipeline/run/${PIPELINE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VECTORSHIFT_API_KEY}`,
        },
        body: JSON.stringify({
          input_data: { input_1: incomingMsg },
        }),
      }
    );

    const data = await response.json();
    console.log("Respuesta VectorShift:", data);

    if (data && data.output && data.output.output_1) {
      reply = data.output.output_1;
    } else {
      reply = "No encontré una respuesta en VectorShift, pero aquí estoy 😉.";
    }
  } catch (error) {
    console.error("Error en fetch:", error);
  }

  // Responder por WhatsApp
  await client.messages.create({
    from: "whatsapp:+14155238886", // número de Twilio Sandbox
    to: from,
    body: reply,
  });

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
