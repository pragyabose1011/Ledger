"""Export meeting data to PDF."""
import io
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

from app.db.session import SessionLocal
from app.db.models.meeting import Meeting
from app.db.models.decision import Decision
from app.db.models.action_item import ActionItem
from app.db.models.risk import Risk
from app.db.models.transcript import Transcript
from app.db.models.user import User
from app.api.auth import get_current_user

router = APIRouter(prefix="/export", tags=["export"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Custom colors matching Ledger theme
LEDGER_PINK = colors.HexColor("#f472b6")
LEDGER_DARK = colors.HexColor("#0f172a")
LEDGER_SLATE = colors.HexColor("#1e293b")


def create_meeting_pdf(meeting, decisions, action_items, risks, transcript_content):
    """Generate PDF for a meeting."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    # Styles
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=6,
        textColor=LEDGER_DARK,
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.gray,
        spaceAfter=20,
    )
    
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=20,
        spaceAfter=10,
        textColor=LEDGER_PINK,
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6,
        leading=14,
    )
    
    item_style = ParagraphStyle(
        'ListItem',
        parent=styles['Normal'],
        fontSize=10,
        leftIndent=20,
        spaceAfter=8,
        leading=14,
    )

    # Build document
    story = []

    # Header
    story.append(Paragraph("◉ Ledger", ParagraphStyle(
        'Logo',
        parent=styles['Normal'],
        fontSize=12,
        textColor=LEDGER_PINK,
        spaceAfter=20,
    )))
    
    # Title
    story.append(Paragraph(meeting.title, title_style))
    
    # Metadata
    created_date = meeting.created_at.strftime("%B %d, %Y at %I:%M %p") if meeting.created_at else "Unknown date"
    platform = meeting.platform or "Unknown platform"
    story.append(Paragraph(f"{platform} • {created_date}", subtitle_style))
    
    story.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey, spaceAfter=20))

    # Summary stats
    stats_data = [
        ["Decisions", "Action Items", "Risks"],
        [str(len(decisions)), str(len(action_items)), str(len(risks))],
    ]
    stats_table = Table(stats_data, colWidths=[2 * inch, 2 * inch, 2 * inch])
    stats_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('FONTSIZE', (0, 1), (-1, 1), 18),
        ('TEXTCOLOR', (0, 1), (-1, 1), LEDGER_PINK),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 1), (-1, 1), 6),
    ]))
    story.append(stats_table)
    story.append(Spacer(1, 20))

    # Decisions section
    if decisions:
        story.append(Paragraph("✓ Decisions", section_style))
        for i, d in enumerate(decisions, 1):
            confidence = f" ({int(d.confidence * 100)}% confidence)" if d.confidence else ""
            story.append(Paragraph(f"{i}. {d.summary}{confidence}", item_style))
    else:
        story.append(Paragraph("✓ Decisions", section_style))
        story.append(Paragraph("No decisions recorded.", item_style))

    # Action Items section
    if action_items:
        story.append(Paragraph("◆ Action Items", section_style))
        for i, a in enumerate(action_items, 1):
            status_icon = "✓" if a.status == "done" else "○"
            owner_text = f" — {a.owner_name}" if hasattr(a, 'owner_name') and a.owner_name else ""
            status_text = " [DONE]" if a.status == "done" else ""
            story.append(Paragraph(
                f"{status_icon} {a.description}{owner_text}{status_text}",
                item_style
            ))
    else:
        story.append(Paragraph("◆ Action Items", section_style))
        story.append(Paragraph("No action items.", item_style))

    # Risks section
    if risks:
        story.append(Paragraph("⚠ Risks & Blockers", section_style))
        for i, r in enumerate(risks, 1):
            confidence = f" ({int(r.confidence * 100)}% confidence)" if r.confidence else ""
            story.append(Paragraph(f"{i}. {r.description}{confidence}", item_style))
    else:
        story.append(Paragraph("⚠ Risks & Blockers", section_style))
        story.append(Paragraph("No risks identified.", item_style))

    # Transcript section (abbreviated)
    if transcript_content:
        story.append(Paragraph("📝 Transcript", section_style))
        lines = transcript_content.split("\n")[:20]  # First 20 lines
        for line in lines:
            if line.strip():
                # Escape special characters for reportlab
                safe_line = line.strip().replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                story.append(Paragraph(safe_line, ParagraphStyle(
                    'TranscriptLine',
                    parent=styles['Normal'],
                    fontSize=9,
                    textColor=colors.darkgray,
                    leftIndent=10,
                    spaceAfter=4,
                )))
        if len(transcript_content.split("\n")) > 20:
            story.append(Paragraph(f"... and {len(transcript_content.split(chr(10))) - 20} more lines", ParagraphStyle(
                'More',
                parent=styles['Normal'],
                fontSize=9,
                textColor=colors.gray,
                leftIndent=10,
                fontName='Helvetica-Oblique',
            )))

    # Footer
    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey, spaceBefore=20))
    story.append(Paragraph(
        f"Generated by Ledger on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}",
        ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.gray,
            alignment=1,  # Center
            spaceBefore=10,
        )
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer


@router.get("/meeting/{meeting_id}/pdf")
def export_meeting_pdf(
    meeting_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export a meeting to PDF."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Get related data
    decisions = db.query(Decision).filter(Decision.meeting_id == meeting_id).all()
    action_items = db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).all()
    risks = db.query(Risk).filter(Risk.meeting_id == meeting_id).all()
    
    # Add owner names to action items
    for item in action_items:
        if item.owner_id:
            owner = db.query(User).filter(User.id == item.owner_id).first()
            item.owner_name = owner.name if owner else None
        else:
            item.owner_name = None

    transcript = db.query(Transcript).filter(Transcript.meeting_id == meeting_id).first()
    transcript_content = transcript.content if transcript else None

    # Generate PDF
    pdf_buffer = create_meeting_pdf(meeting, decisions, action_items, risks, transcript_content)

    # Create safe filename
    safe_title = "".join(c for c in meeting.title if c.isalnum() or c in (' ', '-', '_')).rstrip()
    filename = f"ledger-{safe_title}-{meeting_id[:8]}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )