import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();

// Twilio envía x-www-form-urlencoded, y a veces JSON según config.
// Soportamos ambos:
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;

app.post("/webhook", async (req, res) => {
  try {
    // Twilio usa Body/From en form-urlencoded
    const incomingMessage =
      req.body?.Body || req.body?.body || req.body?.message || "";
    const from = req.body?.From || "";

    console.log("📩 Mensaje entrante:", { from, text: incomingMessage });

    // Llamada correcta a VectorShift Pipeline Run (¡con /v1!)
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
            // Debe coincidir con el nombre del nodo de entrada en tu pipeline
            input_1: incomingMessage,
          },
        }),
      }
    );

    const data = await vsResp.json();
    console.log("🤖 Respuesta VectorShift:", data);

    // Extraer texto de la respuesta (cubrimos varios formatos posibles)
    let reply =
      data?.output_1 ||
      data?.outputs?.output_1 ||
      data?.outputs?.default ||
      data?.message ||
      data?.text ||
      "";

    if (!reply) {
      // Si VS respondió error (ej. 404 Not Found), muéstralo en logs y manda fallback al usuario
      console.error("⚠️ VectorShift sin respuesta usable. Body:", data);
      reply = "No encontré respuesta en VectorShift, pero aquí estoy 🙂.";
    }

    // Responder a Twilio (TwiML)
    res.set("Content-Type", "text/xml");
    res.send(`
      <Response>
        <Message>${escapeXml(reply)}</Message>
      </Response>
    `);
  } catch (error) {
    console.error("❌ Error en webhook:", error);
    res.set("Content-Type", "text/xml");
    res.send(`
      <Response>
        <Message>Hubo un error en el servidor 😢 Intenta de nuevo en un momento.</Message>
      </Response>
    `);
  }
});

// util para evitar romper el XML
function escapeXml(unsafe = "") {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
