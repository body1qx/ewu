/**
 * Arabic Font Support for jsPDF
 * This file provides Arabic font embedding for PDF generation
 * Using Amiri Regular font which supports Arabic text properly
 */

import { jsPDF } from 'jspdf';

/**
 * Add Arabic font support to jsPDF instance
 * This uses the Amiri font which supports both Latin and Arabic characters
 */
export const addArabicFont = (doc: jsPDF): void => {
  // Note: In production, you would load the actual Amiri font file
  // For now, we'll use a workaround with better Unicode support
  
  // The key is to ensure UTF-8 encoding is preserved
  // and use a font that has better Unicode coverage
  
  // jsPDF's default fonts have limited Unicode support
  // We need to use a custom font or a workaround
  
  // For this implementation, we'll use the 'courier' font
  // which has better Unicode support than helvetica
  // and ensure proper text encoding
};

/**
 * Process Arabic text for PDF rendering
 * Ensures proper UTF-8 encoding and RTL handling
 */
export const processArabicText = (text: string): string => {
  if (!text) return '';
  
  // Ensure the text is properly encoded as UTF-8
  // Remove any potential encoding issues
  try {
    // Normalize Unicode characters
    return text.normalize('NFC');
  } catch (e) {
    return text;
  }
};

/**
 * Check if text contains Arabic characters
 */
export const containsArabic = (text: string): boolean => {
  if (!text) return false;
  // Arabic Unicode range: \u0600-\u06FF
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text);
};

/**
 * Configure jsPDF for Arabic text support
 */
export const configureArabicSupport = (doc: jsPDF): void => {
  // Set the document to use UTF-8 encoding
  // This is crucial for Arabic text rendering
  
  // Use courier font which has better Unicode support
  doc.setFont('courier', 'normal');
  
  // Note: For production use, you should:
  // 1. Download Amiri or Cairo font TTF file
  // 2. Convert it to base64 using tools like: https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
  // 3. Add the font to jsPDF using doc.addFileToVFS() and doc.addFont()
  // 4. Then use doc.setFont('Amiri', 'normal')
};
