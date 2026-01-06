import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { FoodPoisoningCase } from '@/types/types';
import { loadHtml2Canvas } from './loadHtml2Canvas';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

/**
 * Generate Arabic PDF with proper Arabic text rendering
 * Uses HTML-to-Canvas approach for accurate Arabic font rendering
 */
export const generateArabicPDF = async (caseData: FoodPoisoningCase): Promise<void> => {
  try {
    // Try to use HTML2Canvas approach for better Arabic rendering
    await generateArabicPDFWithCanvas(caseData);
  } catch (error) {
    console.warn('HTML2Canvas approach failed, using fallback:', error);
    // Fallback to direct PDF generation
    generateArabicPDFDirect(caseData);
  }
};

/**
 * Generate Arabic PDF using HTML2Canvas for proper font rendering
 */
const generateArabicPDFWithCanvas = async (caseData: FoodPoisoningCase): Promise<void> => {
  // Load html2canvas
  const html2canvas = await loadHtml2Canvas();
  
  // Create hidden container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-99999px';
  container.style.width = '210mm';
  container.style.backgroundColor = 'white';
  container.style.padding = '12mm';
  container.style.boxSizing = 'border-box';
  container.style.fontFamily = "'Arial', 'Traditional Arabic', 'Arabic Typesetting', 'Simplified Arabic', sans-serif";
  container.style.fontSize = '9pt';
  container.style.direction = 'rtl';
  container.style.textAlign = 'right';
  container.style.color = '#000';
  
  // Build HTML content
  container.innerHTML = buildArabicHTML(caseData);
  
  document.body.appendChild(container);
  
  // Wait for fonts to load
  await document.fonts.ready;
  
  // Render to canvas
  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    width: 794, // A4 width in pixels
    height: 1123 // A4 height in pixels
  });
  
  // Convert to PDF
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  
  // Save
  pdf.save(`Food_Poisoning_Case_${caseData.case_number}_Arabic.pdf`);
  
  // Cleanup
  document.body.removeChild(container);
};

/**
 * Build Arabic HTML content for rendering
 * Professional layout with proper spacing, padding, and table structure
 */
const buildArabicHTML = (data: FoodPoisoningCase): string => {
  return `
    <div style="font-family: Arial, 'Traditional Arabic', sans-serif; direction: rtl; text-align: right; font-size: 9pt; line-height: 1.4;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #000;">
        <div style="border: 1px solid #000; padding: 4px 6px; font-size: 7pt; line-height: 1.3;">
          <div>Code: IFS-FPCIF-221019</div>
          <div>Page 1/1</div>
          <div>Edition 1</div>
        </div>
        <div style="text-align: center; flex: 1; padding: 0 15px;">
          <h1 style="margin: 0 0 3px 0; font-size: 13pt; font-weight: bold;">نموذج تحقيق في حالة تسمم غذائي</h1>
          <p style="margin: 0; font-size: 8pt; color: #555;">Food Poisoning Case Investigation Form</p>
          <p style="margin: 3px 0 0 0; font-size: 8pt; font-weight: bold;">رقم الحالة: ${data.case_number}</p>
        </div>
        <div style="border: 1px solid #000; padding: 10px 8px; font-size: 7pt; width: 55px; text-align: center; line-height: 1.3;">
          SHAWARMER<br/>LOGO
        </div>
      </div>
      
      <!-- General Information -->
      <div style="margin-bottom: 8px;">
        <h3 style="background: #d9d9d9; padding: 4px 8px; margin: 0 0 4px 0; font-size: 10pt; font-weight: bold; border: 1px solid #999;">المعلومات العامة</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
          <tr style="height: 22px;">
            <td style="border: 1px solid #666; padding: 4px 6px; width: 20%; font-weight: bold; background: #f0f0f0; text-align: right;">اسم العميل</td>
            <td style="border: 1px solid #666; padding: 4px 6px; width: 30%; text-align: right;">${data.customer_name || ''}</td>
            <td style="border: 1px solid #666; padding: 4px 6px; width: 20%; font-weight: bold; background: #f0f0f0; text-align: right;">رقم التواصل</td>
            <td style="border: 1px solid #666; padding: 4px 6px; width: 30%; text-align: right;">${data.contact_number || ''}</td>
          </tr>
          <tr style="height: 22px;">
            <td style="border: 1px solid #666; padding: 4px 6px; font-weight: bold; background: #f0f0f0; text-align: right;">العمر</td>
            <td style="border: 1px solid #666; padding: 4px 6px; text-align: right;">${data.age || ''}</td>
            <td style="border: 1px solid #666; padding: 4px 6px; font-weight: bold; background: #f0f0f0; text-align: right;">موقع الفرع</td>
            <td style="border: 1px solid #666; padding: 4px 6px; text-align: right;">${data.store_location || ''}</td>
          </tr>
          <tr style="height: 22px;">
            <td style="border: 1px solid #666; padding: 4px 6px; font-weight: bold; background: #f0f0f0; text-align: right;">تاريخ الطلب</td>
            <td style="border: 1px solid #666; padding: 4px 6px; text-align: right;">${data.order_date || ''}</td>
            <td style="border: 1px solid #666; padding: 4px 6px; font-weight: bold; background: #f0f0f0; text-align: right;">تاريخ الشكوى</td>
            <td style="border: 1px solid #666; padding: 4px 6px; text-align: right;">${data.complaint_date || ''}</td>
          </tr>
        </table>
      </div>
      
      <!-- Signs and Symptoms -->
      <div style="margin-bottom: 8px;">
        <h3 style="background: #d9d9d9; padding: 4px 8px; margin: 0 0 4px 0; font-size: 10pt; font-weight: bold; border: 1px solid #999;">العلامات والأعراض</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
          <tr style="height: 24px;">
            <td style="border: 1px solid #666; padding: 5px 6px; text-align: right;">
              <span style="display: inline-block; margin-left: 12px;">${data.symptom_diarrhea ? '☑' : '☐'} إسهال</span>
              <span style="display: inline-block; margin-left: 12px;">${data.symptom_vomiting ? '☑' : '☐'} قيء</span>
              <span style="display: inline-block; margin-left: 12px;">${data.symptom_nausea ? '☑' : '☐'} غثيان</span>
              <span style="display: inline-block; margin-left: 12px;">${data.symptom_abdominal_cramps ? '☑' : '☐'} ألم بطني</span>
              <span style="display: inline-block; margin-left: 12px;">${data.symptom_fever ? '☑' : '☐'} حمى</span>
              <span style="display: inline-block; margin-left: 12px;">${data.symptom_headache ? '☑' : '☐'} صداع</span>
            </td>
          </tr>
          ${data.symptom_other ? `<tr style="height: 22px;"><td style="border: 1px solid #666; padding: 4px 6px; text-align: right;"><strong>أعراض أخرى:</strong> ${data.symptom_other}</td></tr>` : ''}
        </table>
      </div>
      
      <!-- History of Illness -->
      <div style="margin-bottom: 8px;">
        <h3 style="background: #d9d9d9; padding: 4px 8px; margin: 0 0 4px 0; font-size: 10pt; font-weight: bold; border: 1px solid #999;">تاريخ المرض</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
          <tr style="height: 22px;">
            <td style="border: 1px solid #666; padding: 4px 6px; width: 25%; font-weight: bold; background: #f0f0f0; text-align: right;">تاريخ بداية المرض</td>
            <td style="border: 1px solid #666; padding: 4px 6px; width: 25%; text-align: right;">${data.illness_onset_date || ''}</td>
            <td style="border: 1px solid #666; padding: 4px 6px; width: 25%; font-weight: bold; background: #f0f0f0; text-align: right;">الوقت</td>
            <td style="border: 1px solid #666; padding: 4px 6px; width: 25%; text-align: right;">${data.illness_onset_time || ''}</td>
          </tr>
          <tr style="height: 22px;">
            <td style="border: 1px solid #666; padding: 4px 6px; font-weight: bold; background: #f0f0f0; text-align: right;">المدة (بالأيام)</td>
            <td style="border: 1px solid #666; padding: 4px 6px; text-align: right;">${data.illness_duration_days || ''}</td>
            <td style="border: 1px solid #666; padding: 4px 6px; font-weight: bold; background: #f0f0f0; text-align: right;">التنويم بالمستشفى</td>
            <td style="border: 1px solid #666; padding: 4px 6px; text-align: right;">${data.hospitalization ? 'نعم' : 'لا'}</td>
          </tr>
          ${data.hospitalization && data.hospitalization_date ? `<tr style="height: 22px;"><td style="border: 1px solid #666; padding: 4px 6px; font-weight: bold; background: #f0f0f0; text-align: right;">تاريخ التنويم</td><td colspan="3" style="border: 1px solid #666; padding: 4px 6px; text-align: right;">${data.hospitalization_date}</td></tr>` : ''}
          ${data.travel_history ? `<tr style="height: 22px;"><td style="border: 1px solid #666; padding: 4px 6px; font-weight: bold; background: #f0f0f0; text-align: right;">تاريخ السفر</td><td colspan="3" style="border: 1px solid #666; padding: 4px 6px; text-align: right;">${data.travel_history}</td></tr>` : ''}
          <tr style="height: 22px;">
            <td style="border: 1px solid #666; padding: 4px 6px; font-weight: bold; background: #f0f0f0; text-align: right;">النتيجة</td>
            <td colspan="3" style="border: 1px solid #666; padding: 4px 6px; text-align: right;">${getOutcomeArabic(data.outcome)}${data.outcome_complications ? ' - ' + data.outcome_complications : ''}</td>
          </tr>
        </table>
      </div>
      
      <!-- Food History -->
      <div style="margin-bottom: 8px;">
        <h3 style="background: #d9d9d9; padding: 4px 8px; margin: 0 0 4px 0; font-size: 10pt; font-weight: bold; border: 1px solid #999;">تاريخ تناول الطعام</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
          ${data.last_meal_details ? `<tr style="height: 22px;"><td style="border: 1px solid #666; padding: 4px 6px; width: 30%; font-weight: bold; background: #f0f0f0; text-align: right;">تفاصيل الوجبة الأخيرة</td><td style="border: 1px solid #666; padding: 4px 6px; text-align: right;">${data.last_meal_details}</td></tr>` : ''}
          ${data.previous_meal_details ? `<tr style="height: 22px;"><td style="border: 1px solid #666; padding: 4px 6px; width: 30%; font-weight: bold; background: #f0f0f0; text-align: right;">تفاصيل الوجبة السابقة</td><td style="border: 1px solid #666; padding: 4px 6px; text-align: right;">${data.previous_meal_details}</td></tr>` : ''}
        </table>
      </div>
      
      <!-- Contacts and Order Details -->
      <div style="margin-bottom: 8px;">
        <h3 style="background: #d9d9d9; padding: 4px 8px; margin: 0 0 4px 0; font-size: 10pt; font-weight: bold; border: 1px solid #999;">العائلة والأصدقاء وتفاصيل الطلب</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
          ${data.sick_contacts ? `<tr style="height: 22px;"><td style="border: 1px solid #666; padding: 4px 6px; width: 35%; font-weight: bold; background: #f0f0f0; text-align: right;">الأصدقاء أو أفراد العائلة المرضى</td><td style="border: 1px solid #666; padding: 4px 6px; text-align: right;">${data.sick_contacts}</td></tr>` : ''}
          ${data.order_details ? `<tr style="height: 22px;"><td style="border: 1px solid #666; padding: 4px 6px; width: 35%; font-weight: bold; background: #f0f0f0; text-align: right;">تفاصيل الطلب</td><td style="border: 1px solid #666; padding: 4px 6px; text-align: right;">${data.order_details}</td></tr>` : ''}
        </table>
      </div>
      
      <!-- Lab Investigation -->
      <div style="margin-bottom: 8px;">
        <h3 style="background: #d9d9d9; padding: 4px 8px; margin: 0 0 4px 0; font-size: 10pt; font-weight: bold; border: 1px solid #999;">التحقيق المخبري والإكمال</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt;">
          <tr style="height: 24px;">
            <td style="border: 1px solid #666; padding: 5px 6px; text-align: right;">
              <span style="display: inline-block; margin-left: 15px;">${data.lab_stool ? '☑' : '☐'} عينة براز</span>
              <span style="display: inline-block; margin-left: 15px;">${data.lab_rectal_swab ? '☑' : '☐'} مسحة مستقيمية</span>
              ${data.lab_rectal_swab_datetime ? `<span style="margin-right: 8px;">(${data.lab_rectal_swab_datetime})</span>` : ''}
            </td>
          </tr>
          <tr style="height: 22px;">
            <td style="border: 1px solid #666; padding: 4px 6px; width: 35%; font-weight: bold; background: #f0f0f0; text-align: right;">تم إكمال النموذج بواسطة</td>
            <td style="border: 1px solid #666; padding: 4px 6px; text-align: right;">${data.form_completed_by || ''}</td>
          </tr>
          <tr style="height: 22px;">
            <td style="border: 1px solid #666; padding: 4px 6px; font-weight: bold; background: #f0f0f0; text-align: right;">تاريخ إكمال النموذج</td>
            <td style="border: 1px solid #666; padding: 4px 6px; text-align: right;">${data.form_completion_date || ''}</td>
          </tr>
          ${data.comments ? `<tr style="height: 22px;"><td style="border: 1px solid #666; padding: 4px 6px; font-weight: bold; background: #f0f0f0; text-align: right;">الملاحظات</td><td style="border: 1px solid #666; padding: 4px 6px; text-align: right;">${data.comments}</td></tr>` : ''}
        </table>
      </div>
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

/**
 * Fallback: Direct PDF generation (old method)
 * Used if HTML2Canvas fails
 */
const generateArabicPDFDirect = (caseData: FoodPoisoningCase): void => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  
  // Configure for Arabic text - use courier which has better Unicode support
  doc.setFont('courier');
  doc.setLanguage('ar');
  
  // Header with logo placeholder and code box (RTL layout) - COMPACT
  doc.setFontSize(9);
  doc.setFont('courier', 'bold');
  
  // Code box (left side for RTL) - smaller
  doc.rect(margin, 8, 35, 12);
  doc.setFontSize(7);
  doc.setFont('courier', 'normal');
  doc.text('Code: IFS-FPCIF-221019', margin + 2, 12);
  doc.text('Page 1/1', margin + 2, 15);
  doc.text('Edition 1', margin + 2, 18);
  
  // Title (center) - Arabic - smaller
  doc.setFontSize(12);
  doc.setFont('courier', 'bold');
  const title = 'نموذج تحقيق في حالة تسمم غذائي';
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, 16);
  
  // Logo placeholder (right side for RTL) - smaller
  const logoX = pageWidth - margin - 25;
  doc.rect(logoX, 8, 25, 12);
  doc.setFontSize(7);
  doc.text('SHAWARMER', logoX + 3, 13);
  doc.text('LOGO', logoX + 6, 17);
  
  let yPos = 24;
  
  // General Information Section - COMPACT
  doc.setFontSize(9);
  doc.setFont('courier', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 5, 'F');
  const genInfoTitle = 'المعلومات العامة';
  const genInfoWidth = doc.getTextWidth(genInfoTitle);
  doc.text(genInfoTitle, pageWidth - margin - genInfoWidth - 2, yPos + 3.5);
  yPos += 6;
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: [
      [
        { content: caseData.age?.toString() || '', styles: { halign: 'right', cellWidth: 'auto', font: 'courier' } },
        { content: 'العمر:', styles: { fontStyle: 'bold', halign: 'right', cellWidth: 35, font: 'courier' } },
        { content: caseData.contact_number || '', styles: { halign: 'right', cellWidth: 50, font: 'courier' } },
        { content: 'رقم التواصل:', styles: { fontStyle: 'bold', halign: 'right', cellWidth: 40, font: 'courier' } },
      ],
      [
        { content: '', styles: { halign: 'right', cellWidth: 'auto', font: 'courier' } },
        { content: '', styles: { halign: 'right', cellWidth: 35, font: 'courier' } },
        { content: caseData.customer_name || '', styles: { halign: 'right', cellWidth: 50, font: 'courier' } },
        { content: 'اسم الشكوى:', styles: { fontStyle: 'bold', halign: 'right', cellWidth: 40, font: 'courier' } },
      ],
      [
        { content: caseData.complaint_date || '', styles: { halign: 'right', cellWidth: 'auto', font: 'courier' } },
        { content: 'تاريخ الشكاية:', styles: { fontStyle: 'bold', halign: 'right', cellWidth: 35, font: 'courier' } },
        { content: caseData.order_date || '', styles: { halign: 'right', cellWidth: 50, font: 'courier' } },
        { content: 'تاريخ الطلب:', styles: { fontStyle: 'bold', halign: 'right', cellWidth: 40, font: 'courier' } },
      ],
      [
        { content: '', styles: { halign: 'right', cellWidth: 'auto', font: 'courier' } },
        { content: '', styles: { halign: 'right', cellWidth: 35, font: 'courier' } },
        { content: caseData.store_location || '', styles: { halign: 'right', cellWidth: 50, font: 'courier' } },
        { content: 'موقع الفرع:', styles: { fontStyle: 'bold', halign: 'right', cellWidth: 40, font: 'courier' } },
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, font: 'courier' },
    margin: { left: margin, right: margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 3;
  
  // Signs and Symptoms Section - COMPACT
  doc.setFont('courier', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 5, 'F');
  const symptomsTitle = 'العلامات والأعراض:';
  const symptomsTitleWidth = doc.getTextWidth(symptomsTitle);
  doc.text(symptomsTitle, pageWidth - margin - symptomsTitleWidth - 2, yPos + 3.5);
  yPos += 6;
  
  const symptoms = [
    { label: 'إسهال', checked: caseData.symptom_diarrhea, letter: 'a)' },
    { label: 'قيء', checked: caseData.symptom_vomiting, letter: 'b)' },
    { label: 'تقلصات في البطن', checked: caseData.symptom_abdominal_cramps, letter: 'c)' },
    { label: 'حمى', checked: caseData.symptom_fever, letter: 'd)' },
    { label: 'غثيان', checked: caseData.symptom_nausea, letter: 'e)' },
    { label: 'شعور عام بالإرهاق أو الوهن', checked: caseData.symptom_malaise, letter: 'f)' },
    { label: 'صداع', checked: caseData.symptom_headache, letter: 'g)' },
    { label: 'آلام في الجسم', checked: caseData.symptom_body_ache, letter: 'h)' },
    { label: 'أخرى', checked: !!caseData.symptom_other, letter: 'i)', extra: caseData.symptom_other },
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: [
      [
        { content: (symptoms[2].checked ? '☑' : '☐') + ' ' + symptoms[2].label + ' ' + symptoms[2].letter, styles: { halign: 'right', cellWidth: 'auto', font: 'courier' } },
        { content: (symptoms[1].checked ? '☑' : '☐') + ' ' + symptoms[1].label + ' ' + symptoms[1].letter, styles: { halign: 'right', cellWidth: 60, font: 'courier' } },
        { content: (symptoms[0].checked ? '☑' : '☐') + ' ' + symptoms[0].label + ' ' + symptoms[0].letter, styles: { halign: 'right', cellWidth: 60, font: 'courier' } },
      ],
      [
        { content: (symptoms[5].checked ? '☑' : '☐') + ' ' + symptoms[5].label + ' ' + symptoms[5].letter, styles: { halign: 'right', cellWidth: 'auto', font: 'courier' } },
        { content: (symptoms[4].checked ? '☑' : '☐') + ' ' + symptoms[4].label + ' ' + symptoms[4].letter, styles: { halign: 'right', cellWidth: 60, font: 'courier' } },
        { content: (symptoms[3].checked ? '☑' : '☐') + ' ' + symptoms[3].label + ' ' + symptoms[3].letter, styles: { halign: 'right', cellWidth: 60, font: 'courier' } },
      ],
      [
        { content: (symptoms[8].extra || '') + ' :' + symptoms[8].label + ' ' + symptoms[8].letter, styles: { halign: 'right', cellWidth: 'auto', font: 'courier' } },
        { content: (symptoms[7].checked ? '☑' : '☐') + ' ' + symptoms[7].label + ' ' + symptoms[7].letter, styles: { halign: 'right', cellWidth: 60, font: 'courier' } },
        { content: (symptoms[6].checked ? '☑' : '☐') + ' ' + symptoms[6].label + ' ' + symptoms[6].letter, styles: { halign: 'right', cellWidth: 60, font: 'courier' } },
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, font: 'courier' },
    margin: { left: margin, right: margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 3;
  
  // History of Illness Section - COMPACT
  doc.setFont('courier', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 5, 'F');
  const historyTitle = 'تاريخ المرض';
  const historyTitleWidth = doc.getTextWidth(historyTitle);
  doc.text(historyTitle, pageWidth - margin - historyTitleWidth - 2, yPos + 3.5);
  yPos += 6;
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: [
      [
        { content: caseData.illness_duration_days?.toString() || '', styles: { halign: 'right', cellWidth: 'auto', font: 'courier' } },
        { content: 'المدة (عدد الأيام) بعد المرض:', styles: { fontStyle: 'bold', halign: 'right', cellWidth: 50, font: 'courier' } },
        { content: caseData.illness_onset_time || '', styles: { halign: 'right', cellWidth: 40, font: 'courier' } },
        { content: 'الوقت:', styles: { fontStyle: 'bold', halign: 'right', cellWidth: 20, font: 'courier' } },
      ],
      [
        { content: '', styles: { halign: 'right', cellWidth: 'auto', font: 'courier' } },
        { content: '', styles: { halign: 'right', cellWidth: 50, font: 'courier' } },
        { content: caseData.illness_onset_date || '', styles: { halign: 'right', cellWidth: 40, font: 'courier' } },
        { content: 'تاريخ بداية المرض:', styles: { fontStyle: 'bold', halign: 'right', cellWidth: 20, font: 'courier' } },
      ],
      [
        { content: (caseData.hospitalization_date || '') + ' :التاريخ', styles: { halign: 'right', cellWidth: 'auto', font: 'courier' } },
        { content: (caseData.hospitalization ? '☑' : '☐') + ' التنويم في المستشفى', styles: { fontStyle: 'bold', halign: 'right', cellWidth: 50, font: 'courier' } },
        { content: '', styles: { halign: 'right', cellWidth: 40, font: 'courier' } },
        { content: '', styles: { halign: 'right', cellWidth: 20, font: 'courier' } },
      ],
      [
        { content: 'تاريخ السفر خلال الثلاثة أيام الأخيرة قبل الإصابة بالمرض (يرجى تحديد المكان والزمان):', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right', font: 'courier' } },
      ],
      [
        { content: caseData.travel_history || '', colSpan: 4, styles: { minCellHeight: 8, halign: 'right', font: 'courier' } },
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, font: 'courier' },
    margin: { left: margin, right: margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 2;
  
  // Outcome - COMPACT
  const outcomeLabels = {
    recovered: 'التعافي',
    on_treatment: 'يتلقى العلاج',
    more_complications: 'مضاعفات إضافية',
  };
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: [
      [
        { 
          content: `${outcomeLabels.more_complications} ${caseData.outcome === 'more_complications' ? '☑' : '☐'} c)`, 
          styles: { halign: 'right', cellWidth: 'auto', font: 'courier' } 
        },
        { 
          content: `${outcomeLabels.on_treatment} ${caseData.outcome === 'on_treatment' ? '☑' : '☐'} b)`, 
          styles: { halign: 'right', cellWidth: 45, font: 'courier' } 
        },
        { 
          content: `${outcomeLabels.recovered} ${caseData.outcome === 'recovered' ? '☑' : '☐'} a)`, 
          styles: { halign: 'right', cellWidth: 40, font: 'courier' } 
        },
        { content: 'النتيجة:', styles: { fontStyle: 'bold', halign: 'right', cellWidth: 30, font: 'courier' } },
      ],
      ...(caseData.outcome === 'more_complications' && caseData.outcome_complications ? [
        [
          { content: caseData.outcome_complications, colSpan: 3, styles: { halign: 'right', cellWidth: 'auto', font: 'courier' } },
          { content: 'المضاعفات:', styles: { fontStyle: 'bold', halign: 'right', cellWidth: 30, font: 'courier' } },
        ],
      ] : []),
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, font: 'courier' },
    margin: { left: margin, right: margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 3;
  
  // Food History Section - COMPACT
  doc.setFont('courier', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 5, 'F');
  const foodHistoryTitle = 'تاريخ تناول الطعام';
  const foodHistoryTitleWidth = doc.getTextWidth(foodHistoryTitle);
  doc.text(foodHistoryTitle, pageWidth - margin - foodHistoryTitleWidth - 2, yPos + 3.5);
  yPos += 6;
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: [
      [
        { 
          content: 'اذكر وكتابة الأطعمة التي تناولها في الوجبة الأخيرة: مع ذكر وقت تناولها والمكان الذي تم تناولها به. ضع خطاً تحت الطعام المشتبه به:', 
          colSpan: 1, 
          styles: { fontStyle: 'bold', halign: 'right', minCellHeight: 6, font: 'courier' } 
        },
      ],
      [
        { content: caseData.last_meal_details || '', colSpan: 1, styles: { halign: 'right', minCellHeight: 10, font: 'courier' } },
      ],
      [
        { 
          content: 'اذكر وكتابة الأطعمة التي تناولها في الوجبة التي سبقت الوجبة الأخيرة: مع ذكر وقت تناولها والمكان الذي تم تناولها به. ضع خطاً تحت الطعام المشتبه به:', 
          colSpan: 1, 
          styles: { fontStyle: 'bold', halign: 'right', minCellHeight: 6, font: 'courier' } 
        },
      ],
      [
        { content: caseData.previous_meal_details || '', colSpan: 1, styles: { halign: 'right', minCellHeight: 10, font: 'courier' } },
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, font: 'courier' },
    margin: { left: margin, right: margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 3;
  
  // Contacts/Family & Order Details - COMPACT
  doc.autoTable({
    startY: yPos,
    head: [],
    body: [
      [
        { 
          content: 'هل تعرف أي من الأصدقاء أو أفراد العائلة يعانون من المرض؟ (يرجى ذكر الأسماء وتحديد نوع المرض):', 
          colSpan: 1, 
          styles: { fontStyle: 'bold', halign: 'right', minCellHeight: 6, font: 'courier' } 
        },
      ],
      [
        { content: caseData.sick_contacts || '', colSpan: 1, styles: { halign: 'right', minCellHeight: 8, font: 'courier' } },
      ],
      [
        { 
          content: 'هل كانت الطلبية خاصة بالعميل فقط أم لأكثر من شخص؟ يرجى تحديد الأصناف المطلوبة وهل كان هناك شخص آخر لديه نفس الأعراض أم لا:', 
          colSpan: 1, 
          styles: { fontStyle: 'bold', halign: 'right', minCellHeight: 6, font: 'courier' } 
        },
      ],
      [
        { content: caseData.order_details || '', colSpan: 1, styles: { halign: 'right', minCellHeight: 8, font: 'courier' } },
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, font: 'courier' },
    margin: { left: margin, right: margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 3;
  
  // Lab Investigation & Completion - COMPACT
  doc.autoTable({
    startY: yPos,
    head: [],
    body: [
      [
        { 
          content: `${caseData.lab_rectal_swab_datetime || ''} :(إذا كانت الإجابة نعم، يرجى تحديد التاريخ والوقت) ${caseData.lab_rectal_swab ? '☑' : '☐'} مسحة مستقيمية مأخوذة ،${caseData.lab_stool ? '☑' : '☐'} :التحقيق المخبري: عينة براز`, 
          colSpan: 1, 
          styles: { halign: 'right', minCellHeight: 6, font: 'courier' } 
        },
      ],
      [
        { content: caseData.form_completed_by || '', styles: { halign: 'right', cellWidth: 'auto', font: 'courier' } },
        { content: 'تم إكمال النموذج بواسطة:', styles: { fontStyle: 'bold', halign: 'right', cellWidth: 50, font: 'courier' } },
      ],
      [
        { content: caseData.form_completion_date || '', styles: { halign: 'right', cellWidth: 'auto', font: 'courier' } },
        { content: 'تاريخ إكمال النموذج:', styles: { fontStyle: 'bold', halign: 'right', cellWidth: 50, font: 'courier' } },
      ],
      [
        { content: caseData.comments || '', styles: { halign: 'right', cellWidth: 'auto', minCellHeight: 8, font: 'courier' } },
        { content: 'التعليقات:', styles: { fontStyle: 'bold', halign: 'right', cellWidth: 50, font: 'courier' } },
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, font: 'courier' },
    margin: { left: margin, right: margin },
  });
  
  // Save the PDF
  const fileName = `Food_Poisoning_Case_${caseData.case_number}_Arabic.pdf`;
  doc.save(fileName);
};
