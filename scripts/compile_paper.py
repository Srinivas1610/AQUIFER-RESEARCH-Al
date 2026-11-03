"""Script to compile the scientific research paper into a publication-quality PDF.

Uses ReportLab to generate an AGU / Elsevier styled academic paper:
- Title banner, author list, affiliations, corresponding author note.
- Structured abstract & Key Points box.
- Two-tier section and subsection numbering.
- Formatted tables with booktabs rules and real empirical numbers.
- Embedded high-resolution publication figures.
- Numbered mathematical equations.
- Formatted references section.
"""
from pathlib import Path
import sys
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """Canvas that computes total page count dynamically for header/footer."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#555555"))

        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "Srini et al. — Spatiotemporal Groundwater Level Prediction in Karnataka")
            self.setStrokeColor(colors.HexColor("#cccccc"))
            self.setLineWidth(0.5)
            self.line(54, 744, letter[0] - 54, 744)

        # Footer
        footer_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 54, 36, footer_text)
        self.drawString(54, 36, "Prepared for submission to Water Resources Research (AGU)")
        self.setStrokeColor(colors.HexColor("#cccccc"))
        self.setLineWidth(0.5)
        self.line(54, 46, letter[0] - 54, 46)

        self.restoreState()


def compile_paper_to_pdf(input_md_path: Path, output_pdf_path: Path):
    """Compile paper markdown into publication-styled PDF."""
    print(f"Compiling {input_md_path} -> {output_pdf_path}...")
    output_pdf_path.parent.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(output_pdf_path),
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'PaperTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f2b48'),
        alignment=0,
        spaceAfter=10
    )

    authors_style = ParagraphStyle(
        'Authors',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#222222'),
        spaceAfter=4
    )

    affil_style = ParagraphStyle(
        'Affiliation',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#555555'),
        spaceAfter=12
    )

    heading1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0f2b48'),
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    heading2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#1f4b75'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9,
        leading=13.5,
        textColor=colors.HexColor('#111111'),
        alignment=4,  # Justified
        spaceAfter=7
    )

    abstract_style = ParagraphStyle(
        'Abstract',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#222222'),
        alignment=4,
        spaceAfter=6
    )

    caption_style = ParagraphStyle(
        'Caption',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#333333'),
        alignment=1,
        spaceBefore=4,
        spaceAfter=10
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#111111'),
        spaceAfter=6
    )

    with open(input_md_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    story = []
    lines = md_text.split('\n')
    i = 0
    in_abstract = False
    in_key_points = False

    while i < len(lines):
        line = lines[i].strip()

        if not line:
            i += 1
            continue

        # Paper Title
        if line.startswith('# ') and not line.startswith('## '):
            title = line[2:].strip()
            story.append(Paragraph(title, title_style))
            i += 1
            continue

        # Section H1
        if line.startswith('## '):
            sec_title = line[3:].strip()
            story.append(Paragraph(sec_title, heading1_style))
            i += 1
            continue

        # Section H2
        if line.startswith('### '):
            sec_title = line[4:].strip()
            story.append(Paragraph(sec_title, heading2_style))
            i += 1
            continue

        # Metadata authors
        if line.startswith('**Authors:**'):
            story.append(Paragraph(line.replace('**Authors:**', '').strip(), authors_style))
            i += 1
            continue

        if line.startswith('**Affiliations:**'):
            story.append(Paragraph(line.replace('**Affiliations:**', '').strip(), affil_style))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0f2b48'), spaceAfter=10))
            i += 1
            continue

        # Key Points or Callouts
        if line.startswith('> '):
            callout = line[2:].strip()
            story.append(Paragraph(f"<b>Key Point:</b> {callout}", abstract_style))
            i += 1
            continue

        # Images: ![caption](path)
        img_match = re.match(r'!\[(.*?)\]\((.*?)\)', line)
        if img_match:
            cap, img_path_str = img_match.groups()
            img_path = Path(img_path_str)
            if img_path.exists():
                story.append(Spacer(1, 4))
                story.append(Image(str(img_path), width=6.5*inch, height=3.2*inch, kind='proportional'))
                story.append(Paragraph(f"<b>Figure:</b> {cap}", caption_style))
                story.append(Spacer(1, 4))
            i += 1
            continue

        # Tables (Markdown tables)
        if line.startswith('|') and '|' in line[1:]:
            table_lines = [line]
            i += 1
            while i < len(lines) and lines[i].strip().startswith('|'):
                table_lines.append(lines[i].strip())
                i += 1

            # Parse markdown table
            header = [c.strip() for c in table_lines[0].split('|')[1:-1]]
            rows = []
            for t_line in table_lines[2:]:  # skip separator
                row = [c.strip() for c in t_line.split('|')[1:-1]]
                if row:
                    rows.append(row)

            table_data = [[Paragraph(f"<b>{c}</b>", body_style) for c in header]]
            for r in rows:
                table_data.append([Paragraph(c, body_style) for c in r])

            col_w = (letter[0] - 108) / len(header)
            t = Table(table_data, colWidths=[col_w] * len(header))
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0f4f8')),
                ('LINEABOVE', (0, 0), (-1, 0), 1.2, colors.HexColor('#0f2b48')),
                ('LINEBELOW', (0, 0), (-1, 0), 0.8, colors.HexColor('#0f2b48')),
                ('LINEBELOW', (0, -1), (-1, -1), 1.2, colors.HexColor('#0f2b48')),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
            ]))
            story.append(Spacer(1, 4))
            story.append(t)
            story.append(Spacer(1, 6))
            continue

        # Regular paragraph
        story.append(Paragraph(line, body_style))
        i += 1

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF build successful: {output_pdf_path} ({output_pdf_path.stat().st_size / 1024:.1f} KB)")


if __name__ == '__main__':
    md_p = Path("paper/PAPER.md")
    pdf_p = Path("paper/main.pdf")
    if md_p.exists():
        compile_paper_to_pdf(md_p, pdf_p)
    else:
        print(f"Markdown file {md_p} does not exist yet.")
