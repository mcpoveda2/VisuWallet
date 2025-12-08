const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// parser/parser.js
// Cambiamos a 1.5-flash que es más estable y tiene mejor Free Tier
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });/**
 * 1. REGLAS MANUALES (Rápido, Gratis, Determinista)
 * Intenta extraer datos usando Regex y Diccionarios.
 */
function parseConReglas(texto) {
  const tx = {
    monto: 0,
    categoria: 'otros',
    descripcion: texto, // Por defecto, todo el texto
    tipo: 'expense',    // Asumimos gasto por defecto
    confidence: 0       // Nivel de confianza (0 a 1)
  };

  // A. Detectar Monto (Soporta: 10, 10.50, 10,50, $10)
  const matchMonto = texto.match(/(\d+([.,]\d+)?)/);
  if (matchMonto) {
    tx.monto = parseFloat(matchMonto[1].replace(',', '.'));
    tx.confidence += 0.5; // Si encontramos monto, ya tenemos la mitad del trabajo
  }

  // B. Detectar Palabras Clave (Categorías)
  const textoLower = texto.toLowerCase();
  
  const keywords = {
    comida: ['sushi', 'pizza', 'hamburguesa', 'almuerzo', 'restaurante', 'comí', 'salchipapa'],
    transporte: ['taxi', 'uber', 'bus', 'gasolina', 'pasaje'],
    servicios: ['luz', 'agua', 'internet', 'netflix', 'spotify'],
    salud: ['farmacia', 'medicina', 'doctor'],
    ingreso: ['pagaron', 'sueldo', 'quincena', 'deposito', 'recibí']
  };

  for (const [cat, palabras] of Object.entries(keywords)) {
    if (palabras.some(p => textoLower.includes(p))) {
      // Si es ingreso, cambiamos el tipo
      if (cat === 'ingreso') {
        tx.tipo = 'income';
        tx.categoria = 'salario'; // O 'varios'
      } else {
        tx.categoria = cat;
      }
      tx.confidence += 0.3; // Encontramos categoría
      break; // Dejamos de buscar
    }
  }

  // Limpiar descripción (opcional: quitar el monto del texto)
  // Por simplicidad, dejamos el texto original por ahora.

  return tx;
}

/**
 *  INTELIGENCIA ARTIFICIAL (Gemini)
 * Se usa cuando las reglas no son suficientes o queremos precisión.
 */
async function parseConLLM(texto) {
  const prompt = `
    Eres un asistente financiero. Analiza el siguiente texto de un mensaje de WhatsApp y extrae los datos en formato JSON estrictamente.
    
    Texto: "${texto}"
    
    Reglas:
    1. "tipo": "expense" (gasto) o "income" (ingreso).
    2. "categoria": una palabra simple (ej: comida, transporte, servicios, ropa, tecnologia, salud, otros).
    3. "monto": número (sin símbolos).
    4. "descripcion": resumen corto de qué es.
    5. Si no hay monto, pon 0.
    
    Responde SOLO con el JSON, sin bloques de código markdown.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Limpieza por si Gemini devuelve bloques de código ```json ... ```
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error en Gemini:", error);
    return null; // Retornamos null para que el orquestador sepa que falló
  }
}

/**
 * 3. ORQUESTADOR (La función principal)
 * Decide si usar Reglas o IA.
 */
async function parseTransaccion(texto) {
  // 1. Intentamos con reglas
  const resultadoReglas = parseConReglas(texto);
  
  console.log(`📊 Score Reglas: ${resultadoReglas.confidence} | Cat: ${resultadoReglas.categoria}`);

  // 2. Si la confianza es alta (>= 0.8), nos quedamos con las reglas (Ahorramos Tokens/Tiempo)
  if (resultadoReglas.confidence >= 0.8) {
    console.log("⚡ Usando Reglas (Fast Path)");
    return {
      ...resultadoReglas,
      origen: 'rules',
      fecha: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      cuentaId: 'default'
    };
  }

  // 3. Si la confianza es baja, llamamos a Gemini (Fallback Inteligente)
  console.log("🤖 Usando Gemini (AI Path)...");
  const resultadoIA = await parseConLLM(texto);

  if (resultadoIA) {
    return {
      ...resultadoIA,
      origen: 'gemini',
      fecha: new Date().toISOString().split('T')[0],
      cuentaId: 'default'
    };
  }

  //  Si la IA falla, devolvemos lo que logramos con reglas (Peor es nada)
  return {
    ...resultadoReglas,
    origen: 'rules-fallback',
    fecha: new Date().toISOString().split('T')[0],
    cuentaId: 'default'
  };
}

module.exports = { parseTransaccion };