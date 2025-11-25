require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

app.post('/ocr', async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

  try {
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: 'TEXT_DETECTION' }]
          }
        ]
      }
    );

    const text = response.data.responses[0]?.fullTextAnnotation?.text || '';
    
    // Extrae monto (busca números con decimales)
    const amountMatch = text.match(/\$?\s*(\d+[.,]\d{2}|\d+)/);
    
    // Extrae fecha
    const dateMatch = text.match(/(\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,4})/);

    res.json({
      rawText: text,
      amount: amountMatch ? amountMatch[1].replace(',', '.') : '',
      date: dateMatch ? dateMatch[1] : new Date().toString(),
    });
  } catch (err) {
    console.error('OCR Error:', err.message);
    res.status(500).json({ error: 'OCR failed', details: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`OCR server running on http://localhost:${PORT}`));