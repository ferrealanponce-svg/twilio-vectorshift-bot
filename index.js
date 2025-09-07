import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// 🧠 Memoria simple en RAM
let memory = {}; // { "whatsapp:+521234...": ["(user) Hola", "(bot) Hola!"] }

// 🔑 Variables de entorno (agregar en Render → Environment)
const VECTORSHIFT_API_KEY = process.env.VECTORSHIFT_API_KEY;
const PIPELINE_ID = process.env.PIPELINE_ID;

// 📩 Ruta de Twilio WhatsApp
app.post("/whatsapp", async (req, res) => {
  try {
    const from = req.body.From;
    const body = req.body.Body;

    // Inicializa memoria si no existe
    if (!memory[from]) memory[from] = [];
    memory[from].push(`(user) ${body}`);

    // 🚀 Llamada a pipeline de Vectorshift
    const response = await fetch(`https://api.vectorshift.ai/v1/pipelines/${PIPELINE_ID}/run`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VECTORSHIFT_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input_data: {
          input_1: body, // ⚡️ nombre exacto de tu "Input" en el pipeline
          history: memory[from].join("\n") // historial completo
        }
      })
    });

    const data = await response.json();
    const reply = data.output?.output_1 || "Disculpa, no entendí 🫤";

    // Guarda la respuesta en la memoria
    memory[from].push(`(bot) ${reply}`);

    // 📤 Respuesta XML para Twilio
    res.set("Content-Type", "text/xml");
    res.send(`
      <Response>
        <Message>${reply}</Message>
      </Message>
    `);
  } catch (err) {
    console.error("❌ Error en /whatsapp:", err);
    res.set("Content-Type", "text/xml");
    res.send(`
      <Response>
        <Message>Hubo un error en el servidor 🚨</Message>
      </Response>
    `);
  }
});

// 🌍 Render usa PORT automáticamente
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));
