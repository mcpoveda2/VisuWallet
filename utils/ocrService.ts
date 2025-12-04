// utils/ocrService.ts
// Utilidades ligeras para extraer monto, fecha, concepto y sugerir labels

export interface OCRParsed {
  amount: string | null;
  date: string | null;
  rawText: string;
  labels: string[];
}

// Detecta monto en texto (soporta formatos comunes con . y ,)
export function parseAmount(text: string): string | null {
  if (!text) return null;
  const patterns = [
    /\$\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)/, // $1,234.56
    /([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)\s*(USD|EUR|CLP|ARS|MXN)?/i,
    /total[:\s]*\$?\s*([0-9]+(?:[.,][0-9]{2})?)/i,
    /monto[:\s]*\$?\s*([0-9]+(?:[.,][0-9]{2})?)/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) {
      // Normalizar: dejar punto como separador decimal
      let s = m[1].trim();
      // Si contiene both , and . assume american (1,234.56)
      if (s.indexOf(',') !== -1 && s.indexOf('.') === -1) {
        // European: 1.234,56 -> remove dots, replace comma with dot
        s = s.replace(/\./g, '').replace(/,/g, '.');
      } else if (s.indexOf(',') !== -1 && s.indexOf('.') !== -1) {
        // American with thousand separator comma: remove commas
        s = s.replace(/,/g, '');
      }
      return s;
    }
  }
  return null;
}

// Detecta fecha en formatos comunes y devuelve YYYY-MM-DD o la cadena encontrada
export function parseDate(text: string): string | null {
  if (!text) return null;
  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const d1 = text.match(/(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/);
  if (d1) return d1[1];
  // YYYY/MM/DD
  const d2 = text.match(/(\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})/);
  if (d2) return d2[1];
  // Month name (spanish/english)
  const d3 = text.match(/(\d{1,2}\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})/i);
  if (d3) return d3[1];
  return null;
}

// Extrae una línea representativa como "concepto" (la primera línea con texto no numérico)
export function parseConcept(text: string): string | null {
  if (!text) return null;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    // Si la línea contiene principalmente letras y al menos 3 caracteres
    const letters = line.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '').trim();
    if (letters.length >= 3) return line.slice(0, 150);
  }
  return lines.length ? lines[0].slice(0, 150) : null;
}

// Sugiere labels simples basadas en palabras clave
export function suggestLabels(text: string): string[] {
  if (!text) return [];
  const mapping: { [key: string]: string } = {
    comida: 'Food', restaurante: 'Food', cafe: 'Food', supermercado: 'Food', pizza: 'Food', lunch: 'Food', dinner: 'Food',
    uber: 'Transport', taxi: 'Transport', bus: 'Transport', metro: 'Transport', transporte: 'Transport',
    gasolina: 'Transport', estacionamiento: 'Transport', parking: 'Transport',
    luz: 'Utilities', agua: 'Utilities', telefono: 'Utilities', internet: 'Utilities', servicios: 'Utilities',
    renta: 'Rent', alquiler: 'Rent', vivienda: 'Rent',
    sueldo: 'Salary', salario: 'Salary', pago: 'Salary',
    tienda: 'Shopping', amazon: 'Shopping', mercado: 'Shopping', compra: 'Shopping',
    farmacia: 'Health', medico: 'Health', hospital: 'Health', farmacia: 'Health'
  };

  const found = new Set<string>();
  const lower = text.toLowerCase();
  for (const [k, v] of Object.entries(mapping)) {
    if (lower.includes(k)) found.add(v);
  }

  return Array.from(found).slice(0, 5);
}

// Punto único de entrada: parsea texto crudo OCR y retorna estructura usada por el Formulario
export default function parseOcrText(rawText: string): OCRParsed {
  const amount = parseAmount(rawText);
  const date = parseDate(rawText);
  const concept = parseConcept(rawText);
  const labels = suggestLabels(rawText);

  return {
    amount: amount,
    date: date,
    rawText: rawText,
    labels: labels.length ? labels : [],
  };
}
