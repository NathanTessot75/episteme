import * as pdfjsLib from 'pdfjs-dist';

// Configuration du worker (version .mjs corrigée)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const extractTextFromPDF = async (file) => {
  console.log("1. Début de la lecture du PDF...");
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 10); // On lit un peu plus de pages (10 max)

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // ASTUCE ICI : On joint avec '\n' (saut de ligne) au lieu de ' ' (espace)
      // Cela préserve mieux la structure des paragraphes et titres
      const pageText = textContent.items.map((item) => item.str).join('\n');
      
      // On ajoute un marqueur visuel entre les pages
      fullText += `\n\n--- Page ${i} ---\n\n${pageText}`;
    }

    return fullText;

  } catch (error) {
    console.error("ERREUR PDF:", error);
    throw new Error("Impossible de lire le fichier PDF.");
  }
};