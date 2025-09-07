const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Ruta de prueba
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
    const vsResponse = await fetch("https://api.vectorshift.ai/v1/pipeline/68bce89d1d76e15d837dd4db/run", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.VS_API_KEY}`, // agrega tu API Key en Render
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: [{ role: "user", content: body }],
      }),
    });

    const data = await vsResponse.json();
    console.log("🤖 Respuesta de VectorShift:", data);

    const reply =
      data?.output?.[0]?.content || "⚠️ No entendí tu mensaje.";

    // Respuesta en formato Twilio XML
    res.set("Content-Type", "text/xml");
    res.send(`
      <Response>
        <Message>${reply}</Message>
      </Response>
    `);
  } catch (err) {
    console.error("❌ Error en webhook:", err);
    res.set("Content-Type", "text/xml");
    res.send(`
      <Response>
        <Message>⚠️ Error procesando tu mensaje.</Message>
      </Response>
    `);
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});
