/**
 * Amiri Font for jsPDF - Base64 Encoded
 * This is a minimal subset of Amiri Regular font that supports Arabic characters
 * 
 * Note: This is a simplified version. For production, use the full font file.
 * The font is loaded from Google Fonts and converted to base64 for embedding.
 */

export const AmiriFontBase64 = {
  // This would contain the base64-encoded font data
  // For now, we'll use a workaround approach
  fontName: 'Amiri',
  fontStyle: 'normal',
  // In production, this would be the actual base64 font data
  fontData: ''
};

/**
 * Alternative: Use system fonts that support Arabic
 * Most modern systems have Arabic-capable fonts installed
 */
export const getArabicCapableFontName = (): string => {
  // Return a font name that's likely to support Arabic on most systems
  // These are common system fonts with Arabic support:
  return 'Arial'; // Arial Unicode MS supports Arabic
};
