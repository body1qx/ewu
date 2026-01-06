/**
 * Arabic PDF Helper
 * Provides utilities for proper Arabic text rendering in PDFs
 * 
 * Key features:
 * - UTF-8 text encoding
 * - RTL text direction
 * - Arabic text shaping
 */

import { jsPDF } from 'jspdf';

/**
 * Configure jsPDF instance for Arabic text support
 * Uses a workaround since jsPDF doesn't natively support Arabic fonts well
 */
export const setupArabicPDF = (doc: jsPDF): void => {
  // Set font to one with better Unicode support
  // Note: This is still limited, but better than default
  doc.setFont('helvetica');
  
  // Set language for proper text direction
  doc.setLanguage('ar');
};

/**
 * Reverse Arabic text for PDF rendering
 * This is a workaround for jsPDF's lack of native RTL support
 */
export const reverseArabicText = (text: string): string => {
  if (!text) return '';
  
  // Check if text contains Arabic
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  
  if (!hasArabic) return text;
  
  // Split into words and reverse for RTL display
  // This is a simplified approach
  const words = text.split(' ');
  return words.reverse().join(' ');
};

/**
 * Process text for PDF rendering
 * Handles both Arabic and English text
 */
export const processTextForPDF = (text: string, isArabicPDF: boolean = false): string => {
  if (!text) return '';
  
  // Normalize Unicode
  let processed = text.normalize('NFC');
  
  // If it's an Arabic PDF and text contains Arabic, reverse it
  if (isArabicPDF && /[\u0600-\u06FF]/.test(processed)) {
    // For Arabic PDFs, we need to handle RTL
    // This is a basic implementation
    processed = reverseArabicText(processed);
  }
  
  return processed;
};

/**
 * Check if text contains Arabic characters
 */
export const hasArabicCharacters = (text: string): boolean => {
  if (!text) return false;
  return /[\u0600-\u06FF]/.test(text);
};

/**
 * Split text into Arabic and non-Arabic segments
 * Useful for mixed-language text
 */
export const splitMixedText = (text: string): Array<{ text: string; isArabic: boolean }> => {
  if (!text) return [];
  
  const segments: Array<{ text: string; isArabic: boolean }> = [];
  let currentSegment = '';
  let isCurrentArabic = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isArabic = /[\u0600-\u06FF]/.test(char);
    
    if (i === 0) {
      isCurrentArabic = isArabic;
      currentSegment = char;
    } else if (isArabic === isCurrentArabic) {
      currentSegment += char;
    } else {
      segments.push({ text: currentSegment, isArabic: isCurrentArabic });
      currentSegment = char;
      isCurrentArabic = isArabic;
    }
  }
  
  if (currentSegment) {
    segments.push({ text: currentSegment, isArabic: isCurrentArabic });
  }
  
  return segments;
};
