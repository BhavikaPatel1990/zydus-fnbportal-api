import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOGO_PATH = path.join(__dirname, '../assets/zylogo.jpg');

/**
 * Generate a single patient sticker (101x101mm)
 */
export const generatePatientSticker = (data, stream) => {
    const doc = new PDFDocument({
        size: [286, 286], // 101mm x 101mm approx
        margins: { top: 10, bottom: 10, left: 10, right: 10 }
    });

    doc.pipe(stream);
    renderSticker(doc, data, 0, 0);
    doc.end();
};

/**
 * Generate bulk stickers
 */
export const generateBulkStickers = (stickersData, stream) => {
    const doc = new PDFDocument({
        size: [286, 286],
        margins: { top: 10, bottom: 10, left: 10, right: 10 }
    });

    doc.pipe(stream);

    stickersData.forEach((data, index) => {
        if (index > 0) doc.addPage();
        renderSticker(doc, data, 0, 0);
    });

    doc.end();
};

/**
 * Common render logic for a single sticker page
 */
function renderSticker(doc, data, startX, startY) {
    // Outer Border
    doc.rect(startX + 5, startY + 5, 276, 276).stroke();

    // Logo
    try {
        doc.image(LOGO_PATH, startX + 245, startY + 10, { width: 30 });
    } catch (e) {
        // Logo missing, skip
    }

    doc.fillColor('black');
    
    let y = startY + 20;
    const xLabel = startX + 15;
    const xValue = startX + 65;
    const rowHeight = 14;

    const addRow = (label, value, isBoldValue = false) => {
        doc.fontSize(9).font('Helvetica-Bold').text(label, xLabel, y);
        doc.text(':', xValue - 10, y);
        doc.font(isBoldValue ? 'Helvetica-Bold' : 'Helvetica').text(value || '', xValue, y, { width: 170 });
        y += rowHeight;
    };

    addRow('MRN', data.mr_no);
    addRow('NAME', data.patient_name);
    addRow('DOCTOR', data.doctor);
    addRow('ADM NO.', data.admission_no);
    addRow('BED-WARD', `${data.bed_no} - ${data.ward}`);

    // Horizontal Line
    y += 2;
    doc.moveTo(startX + 5, y).lineTo(startX + 281, y).stroke();
    y += 8;

    addRow('DIET-TYPE', data.diet_name);
    addRow('MENU', data.menu_description, true);
    
    doc.fontSize(9).font('Helvetica-Bold').text('ITEM', xLabel, y);
    doc.text(':', xValue - 10, y);
    doc.font('Helvetica').fontSize(8).text(data.items || '', xValue, y, { width: 180 });
    
    // Estimate items height (approx 10 points per line)
    const itemsLines = Math.ceil((data.items?.length || 0) / 45) || 1;
    y += Math.max(25, itemsLines * 10);

    // Horizontal Line
    doc.moveTo(startX + 5, y).lineTo(startX + 281, y).stroke();
    y += 8;

    doc.fontSize(8).font('Helvetica-Bold').text('NR RMK', xLabel, y);
    doc.text(':', xValue - 10, y);
    doc.font('Helvetica').text(data.nursing_remark || '-', xValue, y, { width: 180 });
    y += 18;

    doc.fontSize(8).font('Helvetica-Bold').text('DT RMK', xLabel, y);
    doc.text(':', xValue - 10, y);
    doc.font('Helvetica').text(data.diet_remark || '-', xValue, y, { width: 180 });
    y += 18;

    doc.fontSize(9).font('Helvetica-Bold').text('ORDER DATE', xLabel, y);
    doc.text(':', xValue - 10, y);
    doc.font('Helvetica').text(data.order_date || '', xValue, y);
    
    // Bottom Border line
    doc.moveTo(startX + 5, 281).lineTo(startX + 281, 281).stroke();
}

/**
 * Generate liquid stickers (using Avery 3422 format or similar)
 * 3 columns x 8 rows typically, but PHP seems to use a custom label class.
 */
export const generateLiquidStickers = (stickersData, stream) => {
    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 30, bottom: 30, left: 20, right: 20 }
    });

    doc.pipe(stream);

    const labelWidth = 180;
    const labelHeight = 90;
    const cols = 3;
    const rows = 8;
    
    let currentItem = 0;

    stickersData.forEach((data) => {
        if (currentItem > 0 && currentItem % (cols * rows) === 0) {
            doc.addPage();
        }

        const pageItem = currentItem % (cols * rows);
        const col = pageItem % cols;
        const row = Math.floor(pageItem / cols);

        const x = 20 + col * (labelWidth + 10);
        const y = 30 + row * (labelHeight + 5);

        renderLiquidLabel(doc, data, x, y, labelWidth, labelHeight);
        currentItem++;
    });

    doc.end();
};

function renderLiquidLabel(doc, data, x, y, width, height) {
    doc.rect(x, y, width, height).stroke();
    
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text(`${data.patient_name.substring(0, 15)} | ${data.mr_no.substring(data.mr_no.length - 8)} | ${data.bed_no}`, x + 5, y + 5);
    
    doc.font('Helvetica').fontSize(7);
    doc.text(`Item: ${data.menu_detail?.substring(0, 30) || '-'}`, x + 5, y + 18);
    
    doc.font('Helvetica-Bold').text(`DtRem:`, x + 5, y + 28);
    doc.font('Helvetica').text(data.diet_remark || '-', x + 40, y + 28, { width: width - 45 });
    
    doc.font('Helvetica-Bold').text(`NurRem:`, x + 5, y + 48);
    doc.font('Helvetica').text(data.nursing_remark || '-', x + 40, y + 48, { width: width - 45 });
    
    doc.font('Helvetica-Bold').text(`Rem|Time:`, x + 5, y + 68);
    doc.font('Helvetica').text(`${data.remarks || '-'} @${data.description}:00`, x + 45, y + 68);
    
    doc.font('Helvetica').fontSize(6);
    doc.text(`OrdDtTime: ${data.order_date}`, x + 5, y + 80);
}
