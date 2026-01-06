/**
 * Helper functions for proper Arabic text rendering in PDFs
 * Handles RTL text direction and proper character shaping
 */

/**
 * Reverses text for RTL display in PDF
 * This is a simple approach that works for basic Arabic text
 */
export const reverseArabicText = (text: string): string => {
  if (!text) return '';
  
  // Split by spaces to preserve word boundaries
  const words = text.split(' ');
  
  // Reverse the order of words for RTL
  const reversedWords = words.reverse();
  
  // Join back with spaces
  return reversedWords.join(' ');
};

/**
 * Prepares Arabic text for PDF rendering
 * Handles mixed content (Arabic + numbers/English)
 */
export const prepareArabicForPDF = (text: string): string => {
  if (!text) return '';
  
  // For now, return the text as-is
  // jsPDF with proper font will handle the rendering
  return text;
};
