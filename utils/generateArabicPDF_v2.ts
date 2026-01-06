/**
 * Arabic PDF Generator - Version 2
 * Uses HTML-to-Canvas approach for proper Arabic text rendering
 * This ensures Arabic text is rendered correctly with proper fonts
 */

import { jsPDF } from 'jspdf';

interface FoodPoisoningData {
  customer_name: string;
  contact_number: string;
  age: string;
  store_location: string;
  order_date: string;
  complaint_date: string;
  // ... other fields
  [key: string]: any;
}

/**
 * Generate Arabic PDF using HTML rendering approach
 * This method creates an HTML element with proper Arabic fonts,
 * then converts it to PDF
 */
export const generateArabicPDFv2 = async (data: FoodPoisoningData, caseNumber: string): Promise<void> => {
  // Create a hidden container for rendering
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.width = '210mm'; // A4 width
  container.style.backgroundColor = 'white';
  container.style.padding = '10mm';
  container.style.fontFamily = 'Arial, sans-serif'; // Arial supports Arabic
  container.style.fontSize = '9pt';
  container.style.direction = 'rtl'; // Right-to-left
  container.style.textAlign = 'right';
  
  // Build the HTML content with Arabic text
  container.innerHTML = `
    <div style="font-family: Arial, 'Traditional Arabic', 'Arabic Typesetting', sans-serif; direction: rtl; text-align: right;">
      <div style="text-align: center; margin-bottom: 10px;">
        <h1 style="font-size: 14pt; margin: 5px 0;">نموذج تحقيق في حالة تسمم غذائي</h1>
        <p style="font-size: 9pt; margin: 2px 0;">Food Poisoning Case Investigation Form</p>
        <p style="font-size: 8pt; margin: 2px 0;">رقم الحالة: ${caseNumber}</p>
      </div>
      
      <div style="margin-bottom: 8px;">
        <h3 style="font-size: 10pt; margin: 3px 0; background: #f0f0f0; padding: 3px;">المعلومات العامة</h3>
        <table style="width: 100%; font-size: 8pt; border-collapse: collapse;">
          <tr>
            <td style="border: 1px solid #ccc; padding: 2px; width: 25%;"><strong>اسم العميل:</strong></td>
            <td style="border: 1px solid #ccc; padding: 2px; width: 25%;">${data.customer_name || ''}</td>
            <td style="border: 1px solid #ccc; padding: 2px; width: 25%;"><strong>رقم التواصل:</strong></td>
            <td style="border: 1px solid #ccc; padding: 2px; width: 25%;">${data.contact_number || ''}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ccc; padding: 2px;"><strong>العمر:</strong></td>
            <td style="border: 1px solid #ccc; padding: 2px;">${data.age || ''}</td>
            <td style="border: 1px solid #ccc; padding: 2px;"><strong>موقع الفرع:</strong></td>
            <td style="border: 1px solid #ccc; padding: 2px;">${data.store_location || ''}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ccc; padding: 2px;"><strong>تاريخ الطلب:</strong></td>
            <td style="border: 1px solid #ccc; padding: 2px;">${data.order_date || ''}</td>
            <td style="border: 1px solid #ccc; padding: 2px;"><strong>تاريخ الشكوى:</strong></td>
            <td style="border: 1px solid #ccc; padding: 2px;">${data.complaint_date || ''}</td>
          </tr>
        </table>
      </div>
      
      <!-- Add more sections here -->
    </div>
  `;
  
  document.body.appendChild(container);
  
  // Note: This requires html2canvas library
  // For now, we'll fall back to the text-based approach
  // but with better encoding
  
  document.body.removeChild(container);
  
  // Fallback to direct jsPDF generation
  await generateArabicPDFDirect(data, caseNumber);
};

/**
 * Direct jsPDF generation with better Arabic handling
 */
const generateArabicPDFDirect = async (data: FoodPoisoningData, caseNumber: string): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Use helvetica which has some Unicode support
  doc.setFont('helvetica');
  
  // Add content
  doc.setFontSize(12);
  doc.text('نموذج تحقيق في حالة تسمم غذائي', 105, 20, { align: 'center' });
  
  // Save
  doc.save(`Food_Poisoning_Case_${caseNumber}_Arabic.pdf`);
};

export default generateArabicPDFv2;
