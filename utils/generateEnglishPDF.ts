import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { FoodPoisoningCase } from '@/types/types';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export const generateEnglishPDF = (caseData: FoodPoisoningCase): void => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  
  // Header with logo placeholder and code box
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  // Logo placeholder (left side)
  doc.setLineWidth(0.3);
  doc.rect(margin, 8, 28, 14);
  doc.setFontSize(7);
  doc.text('SHAWARMER', margin + 4, 13);
  doc.text('LOGO', margin + 7, 17);
  
  // Title (center)
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  const title = 'Food Poisoning Case Investigation Form';
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, 15);
  
  // Case number subtitle
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const caseNum = `Case Number: ${caseData.case_number}`;
  const caseNumWidth = doc.getTextWidth(caseNum);
  doc.text(caseNum, (pageWidth - caseNumWidth) / 2, 19);
  
  // Code box (right side)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const codeBoxX = pageWidth - margin - 35;
  doc.rect(codeBoxX, 8, 35, 14);
  doc.text('Code: IFS-FPCIF-221019', codeBoxX + 2, 12);
  doc.text('Page 1/1', codeBoxX + 2, 15);
  doc.text('Edition 1', codeBoxX + 2, 18);
  
  // Horizontal line under header
  doc.setLineWidth(0.5);
  doc.line(margin, 23, pageWidth - margin, 23);
  
  let yPos = 26;
  
  // General Information Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(217, 217, 217);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F');
  doc.setDrawColor(153, 153, 153);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6);
  doc.text('General Information', margin + 2, yPos + 4);
  yPos += 7;
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: [
      [
        { content: 'Customer name', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: caseData.customer_name || '' },
        { content: 'Contact number', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: caseData.contact_number || '' },
      ],
      [
        { content: 'Age', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: caseData.age?.toString() || '' },
        { content: 'Store location', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: caseData.store_location || '' },
      ],
      [
        { content: 'Order date', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: caseData.order_date || '' },
        { content: 'Complaint date', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: caseData.complaint_date || '' },
      ],
    ],
    theme: 'grid',
    styles: { 
      fontSize: 8.5, 
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
      lineColor: [102, 102, 102],
      lineWidth: 0.2,
      minCellHeight: 6,
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 55 },
      2: { cellWidth: 35 },
      3: { cellWidth: 'auto' },
    },
    margin: { left: margin, right: margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 4;
  
  // Signs and Symptoms Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(217, 217, 217);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F');
  doc.setDrawColor(153, 153, 153);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6);
  doc.text('Signs and Symptoms', margin + 2, yPos + 4);
  yPos += 7;
  
  const symptoms = [
    { label: 'a) Diarrhea', checked: caseData.symptom_diarrhea },
    { label: 'b) Vomiting', checked: caseData.symptom_vomiting },
    { label: 'c) Abdominal cramps', checked: caseData.symptom_abdominal_cramps },
    { label: 'd) Fever', checked: caseData.symptom_fever },
    { label: 'e) Nausea', checked: caseData.symptom_nausea },
    { label: 'f) Malaise', checked: caseData.symptom_malaise },
    { label: 'g) Headache', checked: caseData.symptom_headache },
    { label: 'h) Body-ache', checked: caseData.symptom_body_ache },
    { label: 'i) Other', checked: !!caseData.symptom_other, extra: caseData.symptom_other },
  ];
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: [
      [
        { content: `${symptoms[0].checked ? '☑' : '☐'} ${symptoms[0].label}` },
        { content: `${symptoms[1].checked ? '☑' : '☐'} ${symptoms[1].label}` },
        { content: `${symptoms[2].checked ? '☑' : '☐'} ${symptoms[2].label}` },
      ],
      [
        { content: `${symptoms[3].checked ? '☑' : '☐'} ${symptoms[3].label}` },
        { content: `${symptoms[4].checked ? '☑' : '☐'} ${symptoms[4].label}` },
        { content: `${symptoms[5].checked ? '☑' : '☐'} ${symptoms[5].label}` },
      ],
      [
        { content: `${symptoms[6].checked ? '☑' : '☐'} ${symptoms[6].label}` },
        { content: `${symptoms[7].checked ? '☑' : '☐'} ${symptoms[7].label}` },
        { content: `${symptoms[8].checked ? '☑' : '☐'} ${symptoms[8].label}${symptoms[8].extra ? ': ' + symptoms[8].extra : ''}` },
      ],
    ],
    theme: 'grid',
    styles: { 
      fontSize: 8.5, 
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
      lineColor: [102, 102, 102],
      lineWidth: 0.2,
      minCellHeight: 6.5,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto' },
    },
    margin: { left: margin, right: margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 4;
  
  // History of Illness Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(217, 217, 217);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F');
  doc.setDrawColor(153, 153, 153);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6);
  doc.text('History of Illness', margin + 2, yPos + 4);
  yPos += 7;
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: [
      [
        { content: 'Date of onset of illness', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: caseData.illness_onset_date || '' },
        { content: 'Time', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: caseData.illness_onset_time || '' },
      ],
      [
        { content: 'Duration of illness (days)', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: caseData.illness_duration_days?.toString() || '' },
        { content: 'Hospitalization', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: caseData.hospitalization ? 'Yes' : 'No' },
      ],
      ...(caseData.hospitalization && caseData.hospitalization_date ? [
        [
          { content: 'Hospitalization date', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
          { content: caseData.hospitalization_date, colSpan: 3 },
        ],
      ] : []),
      ...(caseData.travel_history ? [
        [
          { content: 'Travel history (past 2-3 days prior to onset)', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
          { content: caseData.travel_history, colSpan: 3 },
        ],
      ] : []),
    ],
    theme: 'grid',
    styles: { 
      fontSize: 8.5, 
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
      lineColor: [102, 102, 102],
      lineWidth: 0.2,
      minCellHeight: 6,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 40 },
      2: { cellWidth: 35 },
      3: { cellWidth: 'auto' },
    },
    margin: { left: margin, right: margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 3;
  
  // Outcome Section
  const outcomeLabels = {
    recovered: 'a) Recovered',
    on_treatment: 'b) On treatment',
    more_complications: 'c) More complications',
  };
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: [
      [
        { content: 'Outcome', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: `${caseData.outcome === 'recovered' ? '☑' : '☐'} ${outcomeLabels.recovered}` },
        { content: `${caseData.outcome === 'on_treatment' ? '☑' : '☐'} ${outcomeLabels.on_treatment}` },
        { content: `${caseData.outcome === 'more_complications' ? '☑' : '☐'} ${outcomeLabels.more_complications}` },
      ],
      ...(caseData.outcome === 'more_complications' && caseData.outcome_complications ? [
        [
          { content: 'Complications', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
          { content: caseData.outcome_complications, colSpan: 3 },
        ],
      ] : []),
    ],
    theme: 'grid',
    styles: { 
      fontSize: 8.5, 
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
      lineColor: [102, 102, 102],
      lineWidth: 0.2,
      minCellHeight: 6,
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 'auto' },
    },
    margin: { left: margin, right: margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 4;
  
  // Food History Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(217, 217, 217);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F');
  doc.setDrawColor(153, 153, 153);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6);
  doc.text('Food History', margin + 2, yPos + 4);
  yPos += 7;
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: [
      [
        { 
          content: 'Last meal details (place, foods, time, location - underline suspected food)', 
          styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } 
        },
      ],
      [
        { content: caseData.last_meal_details || '', styles: { minCellHeight: 8 } },
      ],
      [
        { 
          content: 'Previous meal details (place, foods, time, location - underline suspected food)', 
          styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } 
        },
      ],
      [
        { content: caseData.previous_meal_details || '', styles: { minCellHeight: 8 } },
      ],
    ],
    theme: 'grid',
    styles: { 
      fontSize: 8.5, 
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
      lineColor: [102, 102, 102],
      lineWidth: 0.2,
    },
    margin: { left: margin, right: margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 4;
  
  // Friends/Family & Order Details Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(217, 217, 217);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F');
  doc.setDrawColor(153, 153, 153);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6);
  doc.text('Contacts and Order Information', margin + 2, yPos + 4);
  yPos += 7;
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: [
      [
        { 
          content: 'Friends/family members who are sick (list members and specify sickness)', 
          styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } 
        },
      ],
      [
        { content: caseData.sick_contacts || '', styles: { minCellHeight: 7 } },
      ],
      [
        { 
          content: 'Order details (individual or group order, items ordered, others with same symptoms)', 
          styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } 
        },
      ],
      [
        { content: caseData.order_details || '', styles: { minCellHeight: 7 } },
      ],
    ],
    theme: 'grid',
    styles: { 
      fontSize: 8.5, 
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
      lineColor: [102, 102, 102],
      lineWidth: 0.2,
    },
    margin: { left: margin, right: margin },
  });
  
  yPos = doc.lastAutoTable.finalY + 4;
  
  // Lab Investigation & Completion Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(217, 217, 217);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F');
  doc.setDrawColor(153, 153, 153);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 6);
  doc.text('Laboratory Investigation and Form Completion', margin + 2, yPos + 4);
  yPos += 7;
  
  doc.autoTable({
    startY: yPos,
    head: [],
    body: [
      [
        { 
          content: `Lab investigation: ${caseData.lab_stool ? '☑' : '☐'} Stool sample, ${caseData.lab_rectal_swab ? '☑' : '☐'} Rectal swab${caseData.lab_rectal_swab_datetime ? ' (Date/Time: ' + caseData.lab_rectal_swab_datetime + ')' : ''}`,
          colSpan: 2,
        },
      ],
      [
        { content: 'Form completed by', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: caseData.form_completed_by || '' },
      ],
      [
        { content: 'Form completion date', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: caseData.form_completion_date || '' },
      ],
      ...(caseData.comments ? [
        [
          { content: 'Comments', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
          { content: caseData.comments },
        ],
      ] : []),
    ],
    theme: 'grid',
    styles: { 
      fontSize: 8.5, 
      cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
      lineColor: [102, 102, 102],
      lineWidth: 0.2,
      minCellHeight: 6,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 'auto' },
    },
    margin: { left: margin, right: margin },
  });
  
  // Save the PDF
  const fileName = `Food_Poisoning_Case_${caseData.case_number}_English.pdf`;
  doc.save(fileName);
};
