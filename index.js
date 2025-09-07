const express = require("express");
const fetch = require("node-fetch");
const twilio = require("twilio");

const app = express();
app.use(express.urlencoded({ extended: false }));

// ⚙️ Tu Pipeline de VectorShift
const PIPELINE_ID = "68bce89d1d76fe15d037dd4b";
const VS_URL = `https://api.vectorshift.ai/v1/pipeline/${PIPELINE_ID}/run`;

app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/webhook", async (req, res) => {
  const incoming = (req.body.Body || "").toString().trim();
  const twiml = new twilio.twiml.MessagingResponse();

  try {
    const r = await fetch(VS_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.VECTORSHIFT_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: { input_1: incoming }
      })
    });

    const data = await r.json();
    const reply =
      (data && data.outputs && data.outputs.output_1) ||
      "Lo siento, no entendí. Intenta reformular tu mensaje.";

    twiml.message(reply);
  } catch (e) {
    console.error("❌ Error VectorShift:", e);
    twiml.message("Error temporal al procesar tu mensaje. Intenta de nuevo.");
  }

  res.type("text/xml").send(twiml.toString());
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
