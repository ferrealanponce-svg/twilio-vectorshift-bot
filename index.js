import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch"; // necesario en Node 18 en Render
import twilio from "twilio";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const MessagingResponse = twilio.twiml.MessagingResponse;

app.post("/webhook", async (req, res) => {
  const incomingMessage = req.body.Body;
  console.log("📩 Mensaje recibido de WhatsApp:", incomingMessage);

  let botReply = "Lo siento, no entendí tu mensaje.";

  try {
    const response = await fetch("https://api.vectorshift.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.VECTORSHIFT_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // tu modelo en VectorShift
        messages: [{ role: "user", content: incomingMessage }]
      })
    });

    const data = await response.json();
    console.log("📨 Respuesta completa de VectorShift:", JSON.stringify(data, null, 2));

    if (data && data.choices && data.choices.length > 0) {
