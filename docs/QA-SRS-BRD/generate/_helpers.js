// Shared helpers for SAMS-QA-SRS docx generators
// Style follows /home/user/sams/docs/generate-manual.js (TH Sarabun New, blue headings)

const {
    Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
    BorderStyle, TableCell, TableRow, Table, WidthType, ShadingType,
    PageBreak, Header, Footer, PageNumber
} = require("/tmp/docx-env/node_modules/docx");
const fs = require("fs");
const path = require("path");

// ─── Text Elements ────────────────────────────────────
function title(text) {
    return new Paragraph({
        children: [new TextRun({ text, bold: true, size: 56, font: "TH Sarabun New", color: "1a3c6e" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
    });
}
function subtitle(text) {
    return new Paragraph({
        children: [new TextRun({ text, bold: true, size: 32, font: "TH Sarabun New", color: "2563eb" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
    });
}
function h1(text) {
    return new Paragraph({
        children: [new TextRun({ text, bold: true, size: 36, font: "TH Sarabun New", color: "1a3c6e" })],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1a3c6e" } },
    });
}
function h2(text) {
    return new Paragraph({
        children: [new TextRun({ text, bold: true, size: 32, font: "TH Sarabun New", color: "2563eb" })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
    });
}
function h3(text) {
    return new Paragraph({
        children: [new TextRun({ text, bold: true, size: 28, font: "TH Sarabun New", color: "333333" })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
    });
}
function p(text, opts = {}) {
    return new Paragraph({
        children: [new TextRun({ text, size: 24, font: "TH Sarabun New", ...opts })],
        spacing: { after: 100 },
    });
}
function bold(text) {
    return p(text, { bold: true });
}
function bullet(text) {
    return new Paragraph({
        children: [new TextRun({ text, size: 24, font: "TH Sarabun New" })],
        bullet: { level: 0 },
        spacing: { after: 60 },
    });
}
function bulletSub(text) {
    return new Paragraph({
        children: [new TextRun({ text, size: 24, font: "TH Sarabun New" })],
        bullet: { level: 1 },
        spacing: { after: 40 },
    });
}
function note(text) {
    return new Paragraph({
        children: [
            new TextRun({ text: "⚠️ หมายเหตุ: ", bold: true, size: 22, font: "TH Sarabun New", color: "d97706" }),
            new TextRun({ text, size: 22, font: "TH Sarabun New", color: "d97706" }),
        ],
        spacing: { after: 100 },
    });
}
function newDesign(text) {
    return new Paragraph({
        children: [
            new TextRun({ text: "🆕 [NEW DESIGN] ", bold: true, size: 22, font: "TH Sarabun New", color: "059669" }),
            new TextRun({ text, size: 22, font: "TH Sarabun New", color: "059669" }),
        ],
        spacing: { after: 100 },
    });
}
function spacer() {
    return new Paragraph({ spacing: { after: 100 }, children: [] });
}
function pageBreak() {
    return new Paragraph({ children: [new PageBreak()] });
}

// ─── Tables ───────────────────────────────────────────
function makeTableRow(cells, isHeader = false) {
    return new TableRow({
        children: cells.map(text =>
            new TableCell({
                children: [new Paragraph({
                    children: [new TextRun({ text: String(text ?? ""), size: 22, font: "TH Sarabun New", bold: isHeader })],
                    spacing: { before: 40, after: 40 },
                })],
                shading: isHeader ? { type: ShadingType.SOLID, color: "e8eef7" } : undefined,
                borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" },
                },
            })
        ),
    });
}
function makeTable(headers, rows) {
    return new Table({
        rows: [makeTableRow(headers, true), ...rows.map(r => makeTableRow(r))],
        width: { size: 100, type: WidthType.PERCENTAGE },
    });
}

// ─── Diagram Placeholder ──────────────────────────────
function diagramPlaceholder(label, mermaidHint) {
    const cells = [
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 100 },
            children: [new TextRun({ text: "📊", size: 48 })],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({
                text: `[ Diagram: ${label} ]`,
                size: 24, font: "TH Sarabun New", color: "1a3c6e", italics: true, bold: true,
            })],
        }),
    ];
    if (mermaidHint) {
        cells.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [new TextRun({
                text: `(ดูแผนภาพ Mermaid ในไฟล์ .md — ${mermaidHint})`,
                size: 20, font: "TH Sarabun New", color: "999999",
            })],
        }));
    }
    const row = new TableRow({
        children: [new TableCell({
            children: cells,
            borders: {
                top: { style: BorderStyle.DASHED, size: 2, color: "aaaaaa" },
                bottom: { style: BorderStyle.DASHED, size: 2, color: "aaaaaa" },
                left: { style: BorderStyle.DASHED, size: 2, color: "aaaaaa" },
                right: { style: BorderStyle.DASHED, size: 2, color: "aaaaaa" },
            },
            shading: { type: ShadingType.SOLID, color: "f8f9fa" },
            width: { size: 100, type: WidthType.PERCENTAGE },
        })],
    });
    return new Table({ rows: [row], width: { size: 100, type: WidthType.PERCENTAGE } });
}

// ─── Cover Page Builder ───────────────────────────────
function coverPage({ docNo, docTitle, subtitleText, version = "1.0", date = "2026-04-27", preparedBy = "Triple-T Development Team" }) {
    return [
        spacer(), spacer(), spacer(), spacer(),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [new TextRun({ text: "🛡️ SAMS", size: 72, bold: true, font: "TH Sarabun New", color: "1a3c6e" })],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
            children: [new TextRun({ text: "Software Requirements Specification & Business Requirements Document", size: 26, font: "TH Sarabun New", color: "666666", italics: true })],
        }),
        title(docTitle),
        subtitle(subtitleText || "ระบบ SAMS — โมดูล Quality Assurance (QA)"),
        spacer(), spacer(),
        makeTable(
            ["รายการ", "รายละเอียด"],
            [
                ["Document No.", docNo],
                ["Module", "Quality Assurance (QA)"],
                ["เวอร์ชัน", version],
                ["วันที่จัดทำ", date],
                ["จัดทำโดย", preparedBy],
                ["อนุมัติโดย", "_(รอลงนาม)_"],
                ["สถานะ", "Draft"],
            ]
        ),
        pageBreak(),
        h1("Revision History"),
        makeTable(
            ["เวอร์ชัน", "วันที่", "ผู้จัดทำ", "รายละเอียดการเปลี่ยนแปลง"],
            [["1.0", date, preparedBy, "ร่างแรก — สร้างจาก codebase + เอกสารอ้างอิง SAMS"]]
        ),
        pageBreak(),
    ];
}

// ─── Document Footer/Header ───────────────────────────
function defaultHeaderFooter(docNo) {
    return {
        headers: {
            default: new Header({
                children: [new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({
                        text: `${docNo} | SAMS QA Module SRS/BRD`,
                        size: 18, font: "TH Sarabun New", color: "999999",
                    })],
                })],
            }),
        },
        footers: {
            default: new Footer({
                children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: "หน้า ", size: 18, font: "TH Sarabun New", color: "999999" }),
                        new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "TH Sarabun New", color: "999999" }),
                        new TextRun({ text: " / ", size: 18, font: "TH Sarabun New", color: "999999" }),
                        new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, font: "TH Sarabun New", color: "999999" }),
                    ],
                })],
            }),
        },
    };
}

// ─── Build & Save ─────────────────────────────────────
function buildDoc({ docNo, sections }) {
    const hf = defaultHeaderFooter(docNo);
    return new Document({
        creator: "Triple-T Development Team",
        title: `SAMS-QA-SRS-${docNo}`,
        description: "SAMS QA Module SRS/BRD Document",
        sections: [{
            properties: {},
            ...hf,
            children: sections,
        }],
    });
}

async function saveDoc(doc, outputPath) {
    const buf = await Packer.toBuffer(doc);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buf);
    const stats = fs.statSync(outputPath);
    console.log(`✅ สร้าง ${path.basename(outputPath)} สำเร็จ (${(stats.size / 1024).toFixed(1)} KB)`);
    return outputPath;
}

module.exports = {
    title, subtitle, h1, h2, h3, p, bold, bullet, bulletSub, note, newDesign,
    spacer, pageBreak, makeTable, diagramPlaceholder,
    coverPage, buildDoc, saveDoc,
};
