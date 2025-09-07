import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";


const app = express();
app.use(bodyParser.urlencoded({ extended: false }));


// Webhook que vas a poner en Twilio
app.post("/twilio-webhook", async (req, res) => {
  try {
    // Enviar el mensaje entrante a Vectorshift
    const response = await fetch("https://api.vectorshift.ai/api/chatbots/run?chatbot_id=68bceec31d76fe15d039596f&is_twilio=True", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": "sk_4euLIwMVubFS0iqZpPUELDChbHGLPaylsFurgc0CyLUqPXaR"
      },
      body: JSON.stringify(req.body)
    });


    const data = await response.text();


    // Regresar la respuesta a Twilio (Vectorshift ya devuelve TwiML)
    res.set("Content-Type", "application/xml");
    res.send(data);


  } catch (err) {
    console.error(err);
    res.status(500).send("<Response><Message>Error interno</Message></Response>");
  }
});


app.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});