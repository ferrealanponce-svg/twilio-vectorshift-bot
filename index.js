import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// 👇 TUS DATOS (NO CAMBIAR el ID; la API key va en Render)
const PIPELINE_ID = "68bce89d1d76fe15d037dd4b";
const VKEY = process.env.VECTORSIFT_API_KEY;

// Pequeño helper para evitar caracteres que rompan el XML de Twilio
function xmlEscape(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

app.get("/", (_req, res) => {
  res.type("text/plain").send("OK");
});

app.post("/webhook", async (req, res) => {
  try {
    const incoming = req.body?.Body || "";
    console.log("📩 Mensaje entrante:", incoming);

    // Llamada correcta al pipeline (YA PROBADA)
    const vs = await fetch(`https://api.vectorshift.ai/v1/pipeline/${PIPELINE_ID}/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VKEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: { input_1: incoming },
      }),
    });

    const data = await vs.json();
    console.log("🤖 VectorShift respondió:", data);

    // Lee la salida (tu pipeline devuelve outputs.output_1)
    const reply =
      (data && data.outputs && (data.outputs.output_1 ?? data.outputs.output)) ||
      "Gracias por tu mensaje. Te responderemos en breve.";

    // Respuesta directa a Twilio con TwiML (no hace falta SDK)
    res.type("text/xml").send(
      `<Response><Message>${xmlEscape(String(reply)).slice(0,1600)}</Message></Response>`
    );
  } catch (err) {
    console.error("❌ Error webhook:", err);
    res.type("text/xml").send(
      `<Response><Message>Ocurrió un error temporal. Intenta de nuevo.</Message></Response>`
    );
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
