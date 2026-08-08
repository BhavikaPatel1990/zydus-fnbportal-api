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
    // =========================
    // STICKER SIZE
    // =========================
    const outerSize = 276;

    // Equal margin from all sides
    const borderMargin = 15;

    // Border position
    const left = startX + borderMargin;
    const top = startY + borderMargin;

    // Border dimensions
    const stickerWidth = outerSize - (borderMargin * 2);
    const stickerHeight = outerSize - (borderMargin * 2);

    // Inner content padding
    const contentPadding = 10;

    // Text positions
    const xLabel = left + contentPadding;
    const xColon = left + 68;
    const xValue = left + 78;

    const defaultValueWidth = stickerWidth - 95;
    const topValueWidth = 125;

    // =========================
    // OUTER BORDER
    // =========================
    doc.rect(left, top, stickerWidth, stickerHeight).stroke();

    // =========================
    // LOGO
    // =========================
    try {
        doc.image( LOGO_PATH, left + stickerWidth - (borderMargin + 2), top - borderMargin , { width: 30 } );
    } catch (e) {
        // Logo missing
    }

    doc.fillColor('black');

    // Start content with equal top spacing
    let y = top + contentPadding;

    // =========================
    // ROW HELPER
    // =========================
    const addRow = (label, value, options = {}) => {
        const {
            fontSize = 9,
            valueFontSize = fontSize,
            isBoldValue = false,
            valueWidth = defaultValueWidth,
            gap = 3
        } = options;

        const safeValue = value || '-';

        // Label
        doc .fontSize(fontSize) .font('Helvetica-Bold') .text(label, xLabel, y, { lineBreak: false });

        // Colon
        doc.text(':', xColon, y, {
            lineBreak: false
        });

        // Calculate value height
        const valueHeight = doc
            .fontSize(valueFontSize)
            .font(isBoldValue ? 'Helvetica-Bold' : 'Helvetica')
            .heightOfString(safeValue, {
                width: valueWidth,
                align: 'left'
            });

        // Value
        doc.text(safeValue, xValue, y, {
            width: valueWidth,
            align: 'left'
        });

        // Next line
        y += Math.max(valueHeight, fontSize) + gap;
    };

    // =========================
    // TOP SECTION
    // =========================
    addRow('MRN', data.mr_no, {
        isBoldValue: true,
        valueWidth: topValueWidth
    });

    addRow('NAME', data.patient_name, {
        isBoldValue: true,
        valueWidth: topValueWidth
    });

    addRow('DOCTOR', data.doctor, {
        isBoldValue: true,
        valueWidth: topValueWidth
    });

    addRow('ADM NO.', data.admission_no, {
        isBoldValue: true,
        valueWidth: topValueWidth
    });

    addRow(
        'BED-WARD',
        `${data.bed_no || ''} - ${data.ward || ''}`,
        {
            isBoldValue: true,
            valueWidth: defaultValueWidth,
            gap: 5
        }
    );

    // =========================
    // SECTION DIVIDER
    // =========================
    doc.moveTo(left, y)
        .lineTo(left + stickerWidth, y)
        .stroke();

    y += 8;

    // =========================
    // MIDDLE SECTION
    // =========================
    // Label
    doc.fontSize(9).font('Helvetica-Bold').text('DIET-TYPE', xLabel, y, { lineBreak: false });

    // Colon
    doc.text(':', xColon, y, { lineBreak: false });

    // Value
    const valueWidth = defaultValueWidth;

    doc.fontSize(9)
        .font('Helvetica')
        .text(data.diet_name || '-', xValue, y, { continued: true, width: valueWidth, align: 'left' })
        .font('Helvetica-Bold')
        .text(', MENU : ', { continued: true })
        .font('Helvetica')
        .text(data.menu_description || '-');

    // Dynamic height handling
    const dietMenuTextForHeight = `${data.diet_name || '-'}, MENU : ${data.menu_description || '-'}`;
    const valueHeight = doc.font('Helvetica').fontSize(9).heightOfString(dietMenuTextForHeight, {
        width: valueWidth
    });

    y += Math.max(valueHeight, 9) + 5;

    addRow('ITEM', data.items, {
        valueFontSize: 8,
        valueWidth: 170,
        gap: 6
    });

    // =========================
    // SECTION DIVIDER
    // =========================
    doc.moveTo(left, y)
        .lineTo(left + stickerWidth, y)
        .stroke();

    y += 8;

    // =========================
    // BOTTOM SECTION
    // =========================
    addRow('NR RMK', data.nursing_remark, {
        fontSize: 8,
        valueFontSize: 8,
        valueWidth: 180
    });

    addRow('DT RMK', data.diet_remark, {
        fontSize: 8,
        valueFontSize: 8,
        valueWidth: 180
    });

    addRow('ORDER DATE', data.order_date, {
        gap: 0
    });
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

    const remarkLabelX = x + 5;
    const remarkValueX = x + 38;
    const remarkTimeValueX = x + 48;

    const remarkTextWidth = width - 42;

    const patientFontSize = 8;
    const normalFontSize = 7;
    const orderDateFontSize = 8;

    const multilineLineGap = -1;

    let cy = y + 3;

    // ===== Patient Info =====
    doc
        .fontSize(patientFontSize)
        .font('Helvetica-Bold');

    doc.text(
        `${data.patient_name.substring(0, 15)} | ${data.mr_no.substring(data.mr_no.length - 8)} | ${data.bed_no}`,
        x + leftPadding,
        cy
    );
    cy += patientFontSize + 3;

    // ===== Item =====
    doc
        .font('Helvetica')
        .fontSize(normalFontSize);

    doc.text(
        `Item: ${data.menu_detail?.substring(0, 30) || '-'}`,
        x + leftPadding,
        cy
    );
    cy += normalFontSize + 3;

    // ===== Diet Remark =====
    doc
        .font('Helvetica-Bold')
        .text('DtRem:', remarkLabelX, cy);

    doc
        .font('Helvetica')
        .text(
            data.diet_remark || '-',
            remarkValueX,
            cy,
            {
                width: remarkTextWidth,
                lineGap: multilineLineGap
            }
        );

    const dietRemarkHeight = doc.heightOfString(data.diet_remark || '-', {
        width: remarkTextWidth,
        lineGap: multilineLineGap
    });
    cy += Math.max(dietRemarkHeight, normalFontSize) + 3;

    // ===== Nursing Remark =====
    doc
        .font('Helvetica-Bold')
        .text('NurRem:', remarkLabelX, cy);

    doc
        .font('Helvetica')
        .text(
            data.nursing_remark || '-',
            remarkValueX,
            cy,
            {
                width: remarkTextWidth,
                lineGap: multilineLineGap
            }
        );

    const nursingRemarkHeight = doc.heightOfString(data.nursing_remark || '-', {
        width: remarkTextWidth,
        lineGap: multilineLineGap
    });
    cy += Math.max(nursingRemarkHeight, normalFontSize) + 3;

    // ===== Remark & Time =====
    const isNbmSticker = data.description === 'NBM BreakDown Time' || data.description === 'NBM' || data.description === '99';
    if (isNbmSticker) {
        doc
            .font('Helvetica-Bold')
            .text('NBM Rem:', remarkLabelX, cy);

        doc
            .font('Helvetica')
            .text(
                data.remarks || '-',
                remarkTimeValueX,
                cy,
                {
                    width: remarkTextWidth - 10,
                    lineGap: multilineLineGap
                }
            );

        const remarkTimeHeight = doc.heightOfString(data.remarks || '-', {
            width: remarkTextWidth - 10,
            lineGap: multilineLineGap
        });
        cy += Math.max(remarkTimeHeight, normalFontSize) + 3;
    } else {
        doc
            .font('Helvetica-Bold')
            .text('Rem|Time:', remarkLabelX, cy);

        const remarkTimeText = `${data.remarks || '-'} @${data.description}:00`;
        doc
            .font('Helvetica')
            .text(
                remarkTimeText,
                remarkTimeValueX,
                cy,
                {
                    width: remarkTextWidth - 10,
                    lineGap: multilineLineGap
                }
            );

        const remarkTimeHeight = doc.heightOfString(remarkTimeText, {
            width: remarkTextWidth - 10,
            lineGap: multilineLineGap
        });
        cy += Math.max(remarkTimeHeight, normalFontSize) + 3;
    }

    // ===== Order Date =====
    doc
        .font('Helvetica')
        .fontSize(orderDateFontSize);

    doc.text(
        `OrdDtTime: ${data.order_date}`,
        x + leftPadding,
        cy
    );
}
