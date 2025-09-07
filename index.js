import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch"; // necesario en Node 16/18 en Render
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const MessagingResponse = twilio.twiml.MessagingResponse;

function extractTextFromVectorShift(data) {
  if (data?.choices?.[0]?.message?.content) return data.choices[0].message.content; // estilo OpenAI
  if (typeof data?.output === "string") return data.output;
  if (data?.output?.text) return data.output.text;
  if (data?.result?.output) return data.result.output;
  if (Array.isArray(data?.results) && (data.results[0]?.output_text || data.results[0]?.text)) {
    return data.results[0].output_text || data.results[0].text;
  }
  if (data?.message) return data.message;
  return null;
}

app.post("/webhook", async (req, res) => {
  const incomingMessage = req.body.Body || "";
  console.log("📩 WhatsApp:", incomingMessage);

  let botReply = "Lo siento, no entendí tu mensaje.";

  try {
    const response = await fetch("https://api.vectorshift.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.VECTORSHIFT_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: incomingMessage }]
      })
    });

    const data = await response.json();
    console.log("📨 VectorShift:", JSON.stringify(data));
    const text = extractTextFromVectorShift(data);
    if (text) botReply = text;
  } catch (error) {
    console.error("❌ Error VectorShift:", error);
  }

  const twiml = new MessagingResponse();
  twiml.message(botReply);

  res.type("text/xml").send(twiml.toString());
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
