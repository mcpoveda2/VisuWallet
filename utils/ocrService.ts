/**
 * OCR Service - Parse text detected from images
 */

export interface OCRParsed {
  amount: number | null;
  date: string | null;
  rawText: string;
  labels: string[];
}

/**
 * Parse amount/number from text using various formats
 * Supports: $1,234.56, 1.234,56, 1234, etc.
 */
export function parseAmount(text: string): number | null {
  if (!text) return null;

  // Remove leading/trailing whitespace
  let cleaned = text.trim();

  // Try to find currency symbols or amounts
  // Pattern: optional $ or currency, optional spaces, digits with optional separators, optional decimals
  const patterns = [
    /\$?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g, // $1,234.56 or $1.234,56
    /(\d+[.,]\d{2})/g, // 1.23 or 1,23
    /(\d+)/g, // plain number
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match.length > 0) {
      // Take the last match (often the largest/total amount)
      let amountStr = match[match.length - 1];

      // Normalize separators: treat both . and , as decimal/thousand separators
      // If there are two separators, the last one is decimal
      const separators = amountStr.match(/[.,]/g) || [];
      if (separators.length > 1) {
        // Multiple separators: last is decimal, others are thousands
        amountStr = amountStr.replace(/[.,]/g, (m, offset) => {
          return offset === amountStr.lastIndexOf(m) ? '.' : '';
        });
      } else if (separators.length === 1) {
        // Single separator: if it's followed by exactly 2 digits, it's decimal
        const lastSepIndex = Math.max(amountStr.lastIndexOf('.'), amountStr.lastIndexOf(','));
        const digitsAfter = amountStr.length - lastSepIndex - 1;
        if (digitsAfter === 2) {
          amountStr = amountStr.replace(',', '.');
        } else {
          // It's a thousands separator, remove it
          amountStr = amountStr.replace(/[.,]/, '');
        }
      }

      // Remove $ and spaces
      amountStr = amountStr.replace(/[\$\s]/g, '');

      const num = parseFloat(amountStr);
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  }

  return null;
}

/**
 * Parse date from text
 * Supports: DD/MM/YYYY, YYYY/MM/DD, month names, etc.
 */
export function parseDate(text: string): string | null {
  if (!text) return null;

  // Date patterns
  const patterns = [
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/g, // DD/MM/YYYY or MM/DD/YYYY
    /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/g, // YYYY/MM/DD
    /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})?/gi,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match.length > 0) {
      return match[0];
    }
  }

  return null;
}

/**
 * Parse concept/description from text (usually first meaningful line)
 */
export function parseConcept(text: string): string | null {
  if (!text) return null;

  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip very short lines (likely noise) and numbers only
    if (trimmed.length > 3 && !/^\d+$/.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

/**
 * Suggest labels based on detected keywords in text
 */
export function suggestLabels(text: string): string[] {
  if (!text) return [];

  const textLower = text.toLowerCase();
  const suggested: string[] = [];

  const labelKeywords: Record<string, string[]> = {
    Food: ['comida', 'restaurant', 'café', 'almuerzo', 'cena', 'desayuno', 'food', 'cafe', 'pizza', 'burger', 'taco'],
    Transport: ['uber', 'taxi', 'gas', 'gasolina', 'transporte', 'bus', 'metro', 'transport', 'combustible'],
    Shopping: ['compra', 'tienda', 'shopping', 'mall', 'mercado', 'store', 'shop'],
    Utilities: ['luz', 'agua', 'gas', 'internet', 'teléfono', 'utilities', 'bill'],
    Rent: ['renta', 'arriendo', 'alquiler', 'rent', 'vivienda'],
    Salary: ['salario', 'sueldo', 'pago', 'salary', 'ingreso', 'pared'],
    Health: ['farmacia', 'doctor', 'médico', 'hospital', 'health', 'medicina', 'medicament'],
  };

  for (const [label, keywords] of Object.entries(labelKeywords)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        suggested.push(label);
        break;
      }
    }
  }

  return [...new Set(suggested)]; // Remove duplicates
}

/**
 * Main export: parse OCR text and extract structured data
 */
export default function parseOcrText(text: string): OCRParsed {
  return {
    amount: parseAmount(text),
    date: parseDate(text),
    rawText: text,
    labels: suggestLabels(text),
  };
}
