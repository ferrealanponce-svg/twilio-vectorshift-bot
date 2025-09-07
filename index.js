const express = require("express");
const bodyParser = require("body-parser");
const fetch = require("node-fetch"); // usamos node-fetch v2
const MessagingResponse = require("twilio").twiml.MessagingResponse;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Ruta webhook para Twilio
app.post("/webhook", async (req, res) => {
  const incomingMsg = req.body.Body; // mensaje de WhatsApp
  console.log("Mensaje recibido:", incomingMsg);

  try {
    // Llamada a tu pipeline de Vectorshift
    const response = await fetch(
      "https://api.vectorshift.ai/v1/pipeline/68bce89d1d76fe15d037dd4b/run",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer sk_4euLIwMVubFS0iqZpPUELDChbHGLPaylsFurgc0CyLUqPXaR", // ⚠️ usa tu API key real
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: {
            input_1: incomingMsg
          }
        })
      }
    );

    const data = await response.json();
    console.log("Respuesta de Vectorshift:", data);

    const twiml = new MessagingResponse();
    if (data.outputs && data.outputs.output_1) {
      twiml.message(data.outputs.output_1);
    } else {
      twiml.message("Lo siento, hubo un error procesando tu mensaje 🙏.");
    }

    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(twiml.toString());
  } catch (error) {
    console.error("Error en webhook:", error);
    const twiml = new MessagingResponse();
    twiml.message("Ocurrió un error interno, inténtalo más tarde.");
    res.writeHead(200, { "Content-Type": "text/xml" });
    res.end(twiml.toString());
  }
});

// Render usa PORT de variable de entorno
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
