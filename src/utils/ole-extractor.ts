/**
 * OLE Object Extractor for Word Documents
 * Extracts MathType formulas stored as OLE objects in .docx files
 * 
 * MathType formulas in Word can be stored as:
 * 1. OoleObject elements in document.xml
 * 2. Binary data in embeddings folder
 * 3. Relationships pointing to formula data
 */

import JSZip from 'jszip';

export interface OleFormula {
  id: string;
  content: string;           // Raw formula content
  latex?: string;           // Extracted LaTeX if available
  mathml?: string;          // Extracted MathML if available
  fallbackImage?: string;   // Base64 of fallback image
}

/**
 * Extract text from OLE object binary data
 * OLE objects contain embedded formula data that can sometimes be read as text
 */
function extractTextFromOleBinary(buffer: Buffer): string {
  try {
    // Convert to string and try to extract readable formula patterns
    const text = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));
    
    // Common patterns in OLE formula data:
    // - LaTeX-like markers
    // - MathML fragments
    // - Plain text representations
    
    // Try to find LaTeX patterns (common in newer MathType exports)
    // Look for $...$, \[...\], or \begin{...}...\end{...}
    const latexMatch = text.match(/(?:\$[^$]*\$|\\[[^\]]*\\]|\\begin\{[^}]*\}[\s\S]*?\\end\{[^}]*\})/);
    if (latexMatch) {
      return latexMatch[0];
    }
    
    // Try to find visible formula text (alphanumeric + math operators)
    const formulaMatch = text.match(/[A-Za-z0-9+\-=*/().^_{}\\[\]| ]+/);
    if (formulaMatch && formulaMatch[0].length > 5) {
      return formulaMatch[0].trim();
    }
    
    return '';
  } catch {
    return '';
  }
}

/**
 * Convert simple extracted formula text to basic LaTeX
 */
function simplifyFormulaToLatex(text: string): string {
  if (!text) return '';
  
  // Basic replacements for common formula patterns
  let latex = text
    // Fractions: a/b -> \frac{a}{b}
    .replace(/([A-Za-z0-9]+)\/([A-Za-z0-9]+)/g, '\\frac{$1}{$2}')
    // Powers: a^2 -> a^{2}
    .replace(/([A-Za-z0-9])\^([A-Za-z0-9]+)/g, '$1^{$2}')
    // Subscripts: a_1 -> a_{1}
    .replace(/([A-Za-z])\s*_\s*([A-Za-z0-9]+)/g, '$1_{$2}')
    // Square root: sqrt(x) -> \sqrt{x}
    .replace(/sqrt\s*\(\s*([^)]+)\s*\)/gi, '\\sqrt{$1}')
    // Multiplication: × * · → \times
    .replace(/[×*·]/g, '\\times')
    // PI symbol
    .replace(/π/g, '\\pi')
    // Degree symbol
    .replace(/°/g, '^\\circ');
  
  return latex;
}

/**
 * Extract OLE formulas from DOCX
 * Returns map of formula IDs to LaTeX/MathML content
 */
export async function extractOleFormulas(buffer: Buffer): Promise<Map<string, OleFormula>> {
  const formulas = new Map<string, OleFormula>();
  
  try {
    const zip = new JSZip();
    await zip.loadAsync(buffer);
    
    // Read document.xml to detect OLE object references
    const documentXml = await zip.file('word/document.xml')?.async('string') || '';
    
    // Detect OLE objects in document.xml
    // Patterns: <o:OleObject>, <w:object>, <mc:AlternateContent> with OLE
    const oleMatches = documentXml.matchAll(/<o:OleObject[^>]*\s+Type="Embed"[^>]*\s+ProgId="([^"]*)"[^>]*\s+ShapeID="([^"]*)"[^>]*>/gi);
    
    let oleIndex = 0;
    for (const match of oleMatches) {
      const progId = match[1];
      const shapeId = match[2];
      
      // Only process MathType objects
      if (!progId.includes('Equation') && !progId.includes('MathType')) {
        continue;
      }
      
      const formulaId = `ole_${oleIndex++}`;
      
      // Try to find the corresponding embedding
      const relationshipId = shapeId; // Often matches the relationship ID
      
      // Read relationships to find embeddings
      const relsXml = await zip.file('word/_rels/document.xml.rels')?.async('string') || '';
      const embeddingMatch = relsXml.match(new RegExp(`<Relationship[^>]*Id="${relationshipId}"[^>]*Target="([^"]*)"`, 'i'));
      
      if (embeddingMatch) {
        const embeddingPath = `word/${embeddingMatch[1]}`;
        try {
          const embeddingData = await zip.file(embeddingPath)?.async('arraybuffer');
          if (embeddingData) {
            const embeddingBuffer = Buffer.from(embeddingData);
            
            // Extract text from binary
            const extractedText = extractTextFromOleBinary(embeddingBuffer);
            
            // Try to identify if it's LaTeX, MathML, or plain formula
            let latex = '';
            let mathml = '';
            
            if (extractedText.includes('<')) {
              // Likely MathML
              mathml = extractedText;
            } else if (extractedText.includes('\\')) {
              // Likely LaTeX
              latex = extractedText;
            } else {
              // Convert to LaTeX
              latex = simplifyFormulaToLatex(extractedText);
            }
            
            formulas.set(formulaId, {
              id: formulaId,
              content: extractedText,
              latex: latex || undefined,
              mathml: mathml || undefined,
            });
          }
        } catch (err) {
          console.warn(`[ole-extractor] Failed to extract embedding ${embeddingPath}:`, err);
        }
      }
    }
    
    console.log(`[ole-extractor] Extracted ${formulas.size} OLE formulas from DOCX`);
  } catch (err) {
    console.warn('[ole-extractor] Error extracting OLE formulas:', err);
  }
  
  return formulas;
}

/**
 * Replace WMF images with extracted OLE formulas in imageMap
 * For each WMF image in the imageMap, attempt to replace with corresponding LaTeX formula
 */
export function replaceOleImagesWithLatex(
  wmfEntries: { index: number; base64: string }[],
  formulas: Map<string, OleFormula>,
  imageMap: Map<number, string>
): number {
  let replacedCount = 0;
  
  // Convert formulas map to array for iteration
  const formulasArray = Array.from(formulas.values());
  
  // For each WMF image, try to find and replace with corresponding formula
  for (let i = 0; i < wmfEntries.length && i < formulasArray.length; i++) {
    const wmfEntry = wmfEntries[i];
    const formula = formulasArray[i];
    
    if (formula.latex) {
      // Replace the WMF base64 in imageMap with a LaTeX marker
      // Format: [[LATEX:formula_content]]
      const latexMarker = `[[LATEX:${formula.latex}]]`;
      imageMap.set(wmfEntry.index, latexMarker);
      replacedCount++;
    }
  }
  
  return replacedCount;
}
