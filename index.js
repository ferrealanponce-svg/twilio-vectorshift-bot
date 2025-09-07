const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch"); // aseguramos node-fetch v2

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Ruta principal de prueba
app.get("/", (req, res) => {
  res.send("✅ Bot funcionando en Render");
});

// Webhook de Twilio
app.post("/webhook", async (req, res) => {
  try {
    const from = req.body.From || "desconocido";
    const body = req.body.Body || "";

    console.log("📩 Mensaje entrante:", from, body);

    // Llamada a VectorShift
    const vsResponse = await fetch("https://api.vectorshift.ai/v1/pipeline/68bce89d1d76fe15d037dd4b/run", {
      method: "POST",
      headers: {
        "Authorization": "Bearer TU_API_KEY_DE_VECTORSHIFT",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: { input_1: body }
      }),
    });

    const data = await vsResponse.json();
    console.log("📤 Respuesta de VectorShift:", data);

    const reply = data.outputs?.output_1 || "Lo siento, no entendí tu mensaje.";

    // Twilio requiere respuesta en TwiML XML
    const twiml = `
      <Response>
        <Message>${reply}</Message>
      </Response>
    `;

    res.set("Content-Type", "text/xml");
    res.send(twiml);

  } catch (error) {
    console.error("❌ Error en /webhook:", error);
    res.status(500).send("Error interno");
  }
});

// Puerto para Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
