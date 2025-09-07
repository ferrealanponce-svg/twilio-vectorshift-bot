import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();

// Twilio manda x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// Ruta de salud para probar en el navegador
app.get("/", (_req, res) => res.send("OK"));

app.post("/twilio-webhook", async (req, res) => {
  try {
    const vsRes = await fetch(
      "https://api.vectorshift.ai/api/chatbots/run?chatbot_id=68bceec31d76fe15d039596f&is_twilio=True",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // ⚠️ por ahora lo dejamos en código para que funcione ya
          "Api-Key": "sk_4euLIwMVubFS0iqZpPUELDChbHGLPaylsFurgc0CyLUqPXaR"
        },
        body: JSON.stringify(req.body)
      }
    );

    const data = await vsRes.text();
    res.set("Content-Type", "application/xml"); // Vectorshift devuelve TwiML
    res.send(data);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send("<Response><Message>Error interno</Message></Response>");
  }
});

// Render necesita usar el puerto del entorno
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
