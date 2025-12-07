import express from "express";
import cors from "cors";

const app = express();
app.use(cors({
    origin: "*",
    methods: "GET,POST",
    allowedHeaders: "Content-Type",
}));
app.use(express.json({ limit: "10mb" }));

// Ruta para recibir la imagen
app.post("/analyze", async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Falta imageBase64" });
    }

    // Hacer request a OLLAMA
    const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llava",
        stream: false,
        prompt: `Eres un asistente experto en análisis de recibos.
        Responde SIEMPRE en formato JSON así:

        {
          "monto_total": "0.00",
          "etiquetas": ["", "", ""],
          "descripcion": ""
        }

        Reglas:
        - monto_total debe tener decimales con punto
        - 4 etiquetas que deben describir la imagen, pueden ser palabra o pocas palabras (en español)
        - descripcion máximo 10 palabras (en español)
        - si ves en la imagen total, USD, o similares, añadelo como monto_total
        - las respuestas deben ser en español
        `,
        images: [imageBase64], // base64 directo
      }),
    });

    const text = await ollamaResponse.text();

    console.log("Respuesta LLaVA:", text);

    // LLaVA responde en streaming, así que extraemos la última línea JSON
    const jsonLine = text.split("\n").filter((l) => l.includes("{"))?.pop();

    const result = JSON.parse(jsonLine);

    return res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
});



app.listen(3001, "0.0.0.0", () => {
  console.log("API lista en http://192.168.1.8:3001"); // CAMBIAR A IP PERSONAL AQUI 
});