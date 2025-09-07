import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";            // usamos fetch ESM seguro en Render
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false })); // Twilio manda x-www-form-urlencoded

const MessagingResponse = twilio.twiml.MessagingResponse;

// Ping simple
app.get("/", (_req, res) => {
  res.status(200).send("Twilio x VectorShift bot OK");
});

// Webhook de WhatsApp
app.post("/webhook", async (req, res) => {
  const incomingMsg = (req.body?.Body || "").toString().trim();
  console.log("📩 Mensaje recibido de WhatsApp:", incomingMsg);
  console.log("🔑 Vars -> has VS KEY:", !!process.env.VECTORSIFT_API_KEY, "has PIPELINE_ID:", !!process.env.PIPELINE_ID);

  let botReply = "Lo siento, no entendí tu mensaje.";

  try {
    // Llamada a VectorShift: pipeline.run
    const payload = {
      pipeline_id: process.env.PIPELINE_ID,
      inputs: { message: incomingMsg }
    };

    const vsResp = await fetch("https://api.vectorshift.ai/pipeline/run", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.VECTORSIFT_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    // Lee como texto y luego intenta parsear JSON (para capturar errores tipo HTML / texto)
    const raw = await vsResp.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("❗ Respuesta NO-JSON de VectorShift:", raw);
      throw new Error("VectorShift respondió en formato no-JSON (probable error de auth o pipeline)");
    }

    console.log("📨 Respuesta VectorShift (JSON):", JSON.stringify(data, null, 2));

    // Extrae el texto de diferentes posibles formas
    const candidates = [
      data?.output_text,
      data?.output?.text,
      data?.outputs?.text,
      data?.result?.[0]?.output_text,
      data?.choices?.[0]?.message?.content, // por si fuera estilo chat.completions
      data?.message?.content,
      typeof data?.output === "string" ? data.output : null
    ].filter(Boolean);

    if (candidates.length > 0) {
      botReply = String(candidates[0]).trim();
    } else {
      botReply = "No recibí texto de VectorShift, pero la llamada se realizó correctamente.";
    }
  } catch (err) {
    console.error("❌ Error al consultar VectorShift:", err);
    botReply = "Hubo un error con el servidor, inténtalo más tarde 🙏";
  }

  // Responder a Twilio con TwiML
  const twiml = new MessagingResponse();
  twiml.message(botReply);

  res.type("text/xml").send(twiml.toString());
});

// Puerto dinámico de Render
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
