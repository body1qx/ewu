/**
 * PDF Generator with Proper Arabic Support
 * Uses browser's rendering engine to properly display Arabic text
 * then converts to PDF using jsPDF
 */

import { jsPDF } from 'jspdf';
import type { FoodPoisoningCase } from '@/types/types';

/**
 * Generate PDF by rendering HTML with proper Arabic fonts
 * This approach uses the browser's text rendering which properly handles Arabic
 */
export const generatePDFWithArabicSupport = async (
  caseData: FoodPoisoningCase,
  language: 'english' | 'arabic'
): Promise<void> => {
  // Create a hidden container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-99999px';
  container.style.width = '794px'; // A4 width in pixels at 96 DPI
  container.style.height = '1123px'; // A4 height in pixels at 96 DPI
  container.style.backgroundColor = 'white';
  container.style.padding = '40px';
  container.style.boxSizing = 'border-box';
  
  // Set font that supports Arabic
  container.style.fontFamily = language === 'arabic' 
    ? "'Arial', 'Traditional Arabic', 'Arabic Typesetting', 'Simplified Arabic', sans-serif"
    : "'Arial', sans-serif";
  
  container.style.fontSize = '11px';
  container.style.lineHeight = '1.4';
  container.style.color = '#000';
  
  // Set direction for Arabic
  if (language === 'arabic') {
    container.style.direction = 'rtl';
    container.style.textAlign = 'right';
  }
  
  // Build the HTML content
  container.innerHTML = buildPDFHTML(caseData, language);
  
  // Append to body
  document.body.appendChild(container);
  
  // Wait for fonts to load
  await document.fonts.ready;
  
  // Use html2canvas if available, otherwise fall back to text-based PDF
  if (typeof window !== 'undefined' && (window as any).html2canvas) {
    const canvas = await (window as any).html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    const fileName = `Food_Poisoning_Case_${caseData.case_number}_${language === 'arabic' ? 'Arabic' : 'English'}.pdf`;
    pdf.save(fileName);
  } else {
    // Fallback: Use the existing text-based generation
    console.warn('html2canvas not available, using fallback method');
    // Import and use the existing generators
    const { generateEnglishPDF } = await import('./generateEnglishPDF');
    const { generateArabicPDF } = await import('./generateArabicPDF');
    
    if (language === 'arabic') {
      generateArabicPDF(caseData);
    } else {
      generateEnglishPDF(caseData);
    }
  }
  
  // Clean up
  document.body.removeChild(container);
};

/**
 * Build HTML content for PDF
 */
const buildPDFHTML = (data: FoodPoisoningCase, language: 'english' | 'arabic'): string => {
  if (language === 'arabic') {
    return buildArabicHTML(data);
  } else {
    return buildEnglishHTML(data);
  }
};

/**
 * Build Arabic HTML content
 */
const buildArabicHTML = (data: FoodPoisoningCase): string => {
  return `
    <div style="font-family: Arial, 'Traditional Arabic', sans-serif; direction: rtl; text-align: right;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 10px;">
        <div style="border: 1px solid #000; padding: 5px; font-size: 9px;">
          <div>Code: IFS-FPCIF-221019</div>
          <div>Page 1/1</div>
          <div>Edition 1</div>
        </div>
        <div style="text-align: center; flex: 1;">
          <h1 style="margin: 0; font-size: 16px; font-weight: bold;">نموذج تحقيق في حالة تسمم غذائي</h1>
          <p style="margin: 2px 0; font-size: 10px;">Food Poisoning Case Investigation Form</p>
          <p style="margin: 2px 0; font-size: 9px;">رقم الحالة: ${data.case_number}</p>
        </div>
        <div style="border: 1px solid #000; padding: 10px; font-size: 9px; width: 60px; text-align: center;">
          SHAWARMER<br/>LOGO
        </div>
      </div>
      
      <!-- General Information -->
      <div style="margin-bottom: 10px;">
        <h3 style="background: #e0e0e0; padding: 4px; margin: 0 0 5px 0; font-size: 11px;">المعلومات العامة</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <tr>
            <td style="border: 1px solid #999; padding: 3px; width: 25%; font-weight: bold; background: #f5f5f5;">اسم العميل</td>
            <td style="border: 1px solid #999; padding: 3px; width: 25%;">${data.customer_name || ''}</td>
            <td style="border: 1px solid #999; padding: 3px; width: 25%; font-weight: bold; background: #f5f5f5;">رقم التواصل</td>
            <td style="border: 1px solid #999; padding: 3px; width: 25%;">${data.contact_number || ''}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #999; padding: 3px; font-weight: bold; background: #f5f5f5;">العمر</td>
            <td style="border: 1px solid #999; padding: 3px;">${data.age || ''}</td>
            <td style="border: 1px solid #999; padding: 3px; font-weight: bold; background: #f5f5f5;">موقع الفرع</td>
            <td style="border: 1px solid #999; padding: 3px;">${data.store_location || ''}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #999; padding: 3px; font-weight: bold; background: #f5f5f5;">تاريخ الطلب</td>
            <td style="border: 1px solid #999; padding: 3px;">${data.order_date || ''}</td>
            <td style="border: 1px solid #999; padding: 3px; font-weight: bold; background: #f5f5f5;">تاريخ الشكوى</td>
            <td style="border: 1px solid #999; padding: 3px;">${data.complaint_date || ''}</td>
          </tr>
        </table>
      </div>
      
      <!-- Signs and Symptoms -->
      <div style="margin-bottom: 10px;">
        <h3 style="background: #e0e0e0; padding: 4px; margin: 0 0 5px 0; font-size: 11px;">العلامات والأعراض</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <tr>
            <td style="border: 1px solid #999; padding: 3px;">
              ${data.symptom_diarrhea ? '☑' : '☐'} إسهال &nbsp;&nbsp;
              ${data.symptom_vomiting ? '☑' : '☐'} قيء &nbsp;&nbsp;
              ${data.symptom_nausea ? '☑' : '☐'} غثيان &nbsp;&nbsp;
              ${data.symptom_abdominal_cramps ? '☑' : '☐'} ألم بطني &nbsp;&nbsp;
              ${data.symptom_fever ? '☑' : '☐'} حمى &nbsp;&nbsp;
              ${data.symptom_headache ? '☑' : '☐'} صداع
            </td>
          </tr>
          ${data.symptom_other ? `<tr><td style="border: 1px solid #999; padding: 3px;"><strong>أعراض أخرى:</strong> ${data.symptom_other}</td></tr>` : ''}
        </table>
      </div>
      
      <!-- History of Illness -->
      <div style="margin-bottom: 10px;">
        <h3 style="background: #e0e0e0; padding: 4px; margin: 0 0 5px 0; font-size: 11px;">تاريخ المرض</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <tr>
            <td style="border: 1px solid #999; padding: 3px; width: 25%; font-weight: bold; background: #f5f5f5;">تاريخ بداية المرض</td>
            <td style="border: 1px solid #999; padding: 3px; width: 25%;">${data.illness_onset_date || ''}</td>
            <td style="border: 1px solid #999; padding: 3px; width: 25%; font-weight: bold; background: #f5f5f5;">الوقت</td>
            <td style="border: 1px solid #999; padding: 3px; width: 25%;">${data.illness_onset_time || ''}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #999; padding: 3px; font-weight: bold; background: #f5f5f5;">المدة (أيام)</td>
            <td style="border: 1px solid #999; padding: 3px;">${data.illness_duration_days || ''}</td>
            <td style="border: 1px solid #999; padding: 3px; font-weight: bold; background: #f5f5f5;">التنويم</td>
            <td style="border: 1px solid #999; padding: 3px;">${data.hospitalization ? 'نعم - ' + (data.hospitalization_date || '') : 'لا'}</td>
          </tr>
          ${data.travel_history ? `<tr><td colspan="4" style="border: 1px solid #999; padding: 3px;"><strong>تاريخ السفر:</strong> ${data.travel_history}</td></tr>` : ''}
          <tr>
            <td style="border: 1px solid #999; padding: 3px; font-weight: bold; background: #f5f5f5;">النتيجة</td>
            <td colspan="3" style="border: 1px solid #999; padding: 3px;">${getOutcomeArabic(data.outcome)} ${data.outcome_complications ? '- ' + data.outcome_complications : ''}</td>
          </tr>
        </table>
      </div>
      
      <!-- Food History -->
      <div style="margin-bottom: 10px;">
        <h3 style="background: #e0e0e0; padding: 4px; margin: 0 0 5px 0; font-size: 11px;">تاريخ تناول الطعام</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          ${data.last_meal_details ? `<tr><td style="border: 1px solid #999; padding: 3px;"><strong>تفاصيل الوجبة الأخيرة:</strong> ${data.last_meal_details}</td></tr>` : ''}
          ${data.previous_meal_details ? `<tr><td style="border: 1px solid #999; padding: 3px;"><strong>تفاصيل الوجبة السابقة:</strong> ${data.previous_meal_details}</td></tr>` : ''}
        </table>
      </div>
      
      <!-- Contacts and Order Details -->
      <div style="margin-bottom: 10px;">
        <h3 style="background: #e0e0e0; padding: 4px; margin: 0 0 5px 0; font-size: 11px;">العائلة والأصدقاء وتفاصيل الطلب</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          ${data.sick_contacts ? `<tr><td style="border: 1px solid #999; padding: 3px;"><strong>الأصدقاء أو أفراد العائلة المرضى:</strong> ${data.sick_contacts}</td></tr>` : ''}
          ${data.order_details ? `<tr><td style="border: 1px solid #999; padding: 3px;"><strong>تفاصيل الطلب:</strong> ${data.order_details}</td></tr>` : ''}
        </table>
      </div>
      
      <!-- Lab Investigation -->
      <div style="margin-bottom: 10px;">
        <h3 style="background: #e0e0e0; padding: 4px; margin: 0 0 5px 0; font-size: 11px;">التحقيق المخبري والإكمال</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <tr>
            <td style="border: 1px solid #999; padding: 3px;">
              ${data.lab_stool ? '☑' : '☐'} عينة براز &nbsp;&nbsp;
              ${data.lab_rectal_swab ? '☑' : '☐'} مسحة مستقيمية ${data.lab_rectal_swab_datetime ? '(' + data.lab_rectal_swab_datetime + ')' : ''}
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #999; padding: 3px; width: 50%; font-weight: bold; background: #f5f5f5;">تم إكمال النموذج بواسطة</td>
            <td style="border: 1px solid #999; padding: 3px; width: 50%;">${data.form_completed_by || ''}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #999; padding: 3px; font-weight: bold; background: #f5f5f5;">تاريخ إكمال النموذج</td>
            <td style="border: 1px solid #999; padding: 3px;">${data.form_completion_date || ''}</td>
          </tr>
          ${data.comments ? `<tr><td colspan="2" style="border: 1px solid #999; padding: 3px;"><strong>الملاحظات:</strong> ${data.comments}</td></tr>` : ''}
        </table>
      </div>
    </div>
  `;
};

/**
 * Build English HTML content
 */
const buildEnglishHTML = (data: FoodPoisoningCase): string => {
  // Similar structure but in English
  return `
    <div style="font-family: Arial, sans-serif;">
      <!-- Similar structure to Arabic but LTR -->
      <div style="text-align: center; margin-bottom: 15px;">
        <h1 style="margin: 0; font-size: 16px;">Food Poisoning Case Investigation Form</h1>
        <p style="margin: 2px 0; font-size: 10px;">Case Number: ${data.case_number}</p>
      </div>
      <!-- Add English content here -->
    </div>
  `;
};

/**
 * Helper function to get outcome in Arabic
 */
const getOutcomeArabic = (outcome: string): string => {
  const outcomes: Record<string, string> = {
    'recovered': 'التعافي',
    'on_treatment': 'يتلقى العلاج',
    'more_complications': 'مضاعفات إضافية'
  };
  return outcomes[outcome] || '';
};
