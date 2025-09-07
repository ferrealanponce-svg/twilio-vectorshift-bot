import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Webhook de Twilio
app.post("/webhook", async (req, res) => {
  const incomingMsg = req.body.Body || "";
  const from = req.body.From || "";

  console.log("📩 Mensaje entrante:", incomingMsg, "de:", from);

  let botReply = "Lo siento, no entendí tu mensaje."; // respuesta por defecto

  try {
    // Llamada a VectorShift
    const response = await fetch("https://api.vectorshift.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.VECTORSHIFT_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: incomingMsg }]
      })
    });

    const data = await response.json();

    // Log para depuración
    console.log("🔍 Respuesta VectorShift:", JSON.stringify(data, null, 2));

    // Manejo de la respuesta
    if (data && data.choices && data.choices.length > 0) {
      if (data.choices[0].message && data.choices[0].message.content) {
        botReply = data.choices[0].message.content;
      } else if (data.choices[0].delta && data.choices[0].delta.content) {
        botReply = data.choices[0].delta.content;
      }
    }
  } catch (error) {
    console.error("❌ Error al consultar VectorShift:", error);
    botReply = "Hubo un error con el servidor, inténtalo más tarde 🙏";
  }

  // Responder a Twilio (WhatsApp)
  const twiml = `
    <Response>
      <Message>${botReply}</Message>
    </Response>
  `;

  res.set("Content-Type", "text/xml");
  res.send(twiml);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
