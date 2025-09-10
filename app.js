// Import Express.js
const express = require('express');
const fetch = require('node-fetch'); // Installer avec: npm install node-fetch

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and tokens
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
const whatsappToken = process.env.WHATSAPP_TOKEN; // Jeton d'accès Meta

// Route for GET requests (webhook verification)
app.get('/', (req, res) => {
  const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.status(403).end();
  }
});

// Route for POST requests (incoming messages)
app.post('/', async (req, res) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`\n\nWebhook reçu le ${timestamp}\n`);
  console.log(JSON.stringify(req.body, null, 2));

  try {
    if (req.body.object) {
      const entry = req.body.entry?.[0];
      const changes = entry.changes?.[0];
      const value = changes.value;

      if (value.messages && value.messages[0]) {
        const from = value.messages[0].from; // Numéro de l'expéditeur
        const msgBody = value.messages[0].text.body; // Message envoyé
        const phoneNumberId = value.metadata.phone_number_id; // ID du numéro WhatsApp Business

        console.log(`Message reçu de ${from}: ${msgBody}`);

        // Réponse automatique
        await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${whatsappToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: from,
            text: { body: `Tu as dit: "${msgBody}" 👋` }
          })
        });

        console.log("Réponse envoyée ✅");
      }
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi de la réponse:", error);
  }

  res.sendStatus(200);
});

// Start the server
app.listen(port, () => {
  console.log(`\nListening on port ${port}\n`);
});
