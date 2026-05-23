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
    const left = startX + 5;
    const top = startY + 5;
    const stickerWidth = 276;
    const stickerHeight = 276;
    const xLabel = startX + 15;
    const xColon = startX + 72;
    const xValue = startX + 80;
    const defaultValueWidth = 181;
    const topValueWidth = 125;

    // Outer Border
    doc.rect(left, top, stickerWidth, stickerHeight).stroke();

    // Logo
    try {
        doc.image(LOGO_PATH, startX + 245, startY + 10, { width: 30 });
    } catch (e) {
        // Logo missing, skip
    }

    doc.fillColor('black');

    let y = startY + 20;

    const addRow = (label, value, options = {}) => {
        const {
            fontSize = 9,
            valueFontSize = fontSize,
            isBoldValue = false,
            valueWidth = defaultValueWidth,
            gap = 3
        } = options;

        const safeValue = value || '-';
        doc.fontSize(fontSize).font('Helvetica-Bold').text(label, xLabel, y, {
            lineBreak: false
        });
        doc.text(':', xColon, y, { lineBreak: false });

        const valueHeight = doc
            .fontSize(valueFontSize)
            .font(isBoldValue ? 'Helvetica-Bold' : 'Helvetica')
            .heightOfString(safeValue, { width: valueWidth, align: 'left' });

        doc.text(safeValue, xValue, y, {
            width: valueWidth,
            align: 'left'
        });

        y += Math.max(valueHeight, fontSize) + gap;
    };

    addRow('MRN', data.mr_no, { isBoldValue: true, valueWidth: topValueWidth });
    addRow('NAME', data.patient_name, { isBoldValue: true, valueWidth: topValueWidth });
    addRow('DOCTOR', data.doctor, { isBoldValue: true, valueWidth: topValueWidth });
    addRow('ADM NO.', data.admission_no, { isBoldValue: true, valueWidth: topValueWidth });
    addRow('BED-WARD', `${data.bed_no || ''} - ${data.ward || ''}`, {
        isBoldValue: true,
        valueWidth: defaultValueWidth,
        gap: 5
    });

    // Horizontal Line
    doc.moveTo(left, y).lineTo(left + stickerWidth, y).stroke();
    y += 8;

    addRow('DIET-TYPE', data.diet_name);
    addRow('MENU', data.menu_description, { isBoldValue: true });
    addRow('ITEM', data.items, { valueFontSize: 8, valueWidth: 180, gap: 6 });

    // Horizontal Line
    doc.moveTo(left, y).lineTo(left + stickerWidth, y).stroke();
    y += 8;

    addRow('NR RMK', data.nursing_remark, { fontSize: 8, valueFontSize: 8, valueWidth: 180 });
    addRow('DT RMK', data.diet_remark, { fontSize: 8, valueFontSize: 8, valueWidth: 180 });
    addRow('ORDER DATE', data.order_date, { gap: 0 });

    // Bottom Border line
    doc.moveTo(left, top + stickerHeight).lineTo(left + stickerWidth, top + stickerHeight).stroke();
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

    // ===== Layout Configuration =====
    const leftPadding = 5;

    const patientInfoY = y + 3;
    const itemY = y + 14;
    const dietRemarkY = y + 24;
    const nursingRemarkY = y + 38;
    const remarkTimeY = y + 48;
    const orderDateY = y + 58;

    const remarkLabelX = x + 5;
    const remarkValueX = x + 38;
    const remarkTimeValueX = x + 48;

    const remarkTextWidth = width - 42;

    const patientFontSize = 8;
    const normalFontSize = 7;
    const orderDateFontSize = 8;

    const multilineLineGap = -1;

    // ===== Patient Info =====
    doc
        .fontSize(patientFontSize)
        .font('Helvetica-Bold');

    doc.text(
        `${data.patient_name.substring(0, 15)} | ${data.mr_no.substring(data.mr_no.length - 8)} | ${data.bed_no}`,
        x + leftPadding,
        patientInfoY
    );

    // ===== Item =====
    doc
        .font('Helvetica')
        .fontSize(normalFontSize);

    doc.text(
        `Item: ${data.menu_detail?.substring(0, 30) || '-'}`,
        x + leftPadding,
        itemY
    );

    // ===== Diet Remark =====
    doc
        .font('Helvetica-Bold')
        .text('DtRem:', remarkLabelX, dietRemarkY);

    doc
        .font('Helvetica')
        .text(
            data.diet_remark || '-',
            remarkValueX,
            dietRemarkY,
            {
                width: remarkTextWidth,
                lineGap: multilineLineGap
            }
        );

    // ===== Nursing Remark =====
    doc
        .font('Helvetica-Bold')
        .text('NurRem:', remarkLabelX, nursingRemarkY);

    doc
        .font('Helvetica')
        .text(
            data.nursing_remark || '-',
            remarkValueX,
            nursingRemarkY,
            {
                width: remarkTextWidth,
                lineGap: multilineLineGap
            }
        );

    // ===== Remark & Time =====
    doc
        .font('Helvetica-Bold')
        .text('Rem|Time:', remarkLabelX, remarkTimeY);

    doc
        .font('Helvetica')
        .text(
            `${data.remarks || '-'} @${data.description}:00`,
            remarkTimeValueX,
            remarkTimeY
        );

    // ===== Order Date =====
    doc
        .font('Helvetica')
        .fontSize(orderDateFontSize);

    doc.text(
        `OrdDtTime: ${data.order_date}`,
        x + leftPadding,
        orderDateY
    );
}
