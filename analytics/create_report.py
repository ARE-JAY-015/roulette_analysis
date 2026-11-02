
from pathlib import Path
from datetime import datetime

import pandas as pd

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    PageBreak,
    KeepTogether,
)

BASE_DIR = Path(__file__).resolve().parent

CHARTS = {
    "Number Frequency": BASE_DIR / "number_frequency.png",
    "Color Distribution": BASE_DIR / "color_distribution.png",
    "Session Comparison": BASE_DIR / "session_comparison.png",
}

VALID_NUMBERS = set(range(37))

NAVY = colors.HexColor("#14243A")
GOLD = colors.HexColor("#C49A45")
LIGHT_BLUE = colors.HexColor("#EEF3F8")
LIGHT_GREY = colors.HexColor("#F4F6F8")
DARK_GREY = colors.HexColor("#4B5563")


def load_data(csv_path):
    """Read the RouletteIQ export and validate its structure."""
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    df = pd.read_csv(csv_path)

    required_columns = {
        "Spin_Number",
        "Result",
        "Color",
        "Parity",
        "Timestamp",
        "Session_ID",
    }

    missing_columns = required_columns - set(df.columns)

    if missing_columns:
        raise ValueError(
            f"CSV is missing columns: {sorted(missing_columns)}"
        )

    if df.empty:
        raise ValueError("The CSV file contains no records.")

    df["Result"] = pd.to_numeric(df["Result"], errors="coerce")
    df["Timestamp"] = pd.to_datetime(
        df["Timestamp"], errors="coerce", utc=True
    )

    return df


def build_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="CoverTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=26,
        leading=32,
        textColor=NAVY,
        alignment=TA_CENTER,
        spaceAfter=12,
    ))

    styles.add(ParagraphStyle(
        name="CoverSubtitle",
        parent=styles["Normal"],
        fontSize=12,
        leading=18,
        textColor=DARK_GREY,
        alignment=TA_CENTER,
        spaceAfter=8,
    ))

    styles.add(ParagraphStyle(
        name="SectionHeading",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=NAVY,
        spaceBefore=10,
        spaceAfter=9,
    ))

    styles.add(ParagraphStyle(
        name="SubHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=NAVY,
        spaceBefore=8,
        spaceAfter=5,
    ))

    styles.add(ParagraphStyle(
        name="ReportBody",
        parent=styles["BodyText"],
        fontSize=9,
        leading=13,
        textColor=DARK_GREY,
        spaceAfter=6,
    ))

    styles.add(ParagraphStyle(
        name="SmallNote",
        parent=styles["BodyText"],
        fontSize=8,
        leading=11,
        textColor=DARK_GREY,
    ))

    return styles


def make_table(data, widths=None):
    table = Table(data, colWidths=widths, repeatRows=1)

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("LEADING", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D7DEE7")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [colors.white, LIGHT_GREY]),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))

    return table



def add_chart(story, title, chart_path, styles):
    story.append(Paragraph(title, styles["SubHeading"]))

    if not chart_path.exists():
        story.append(Paragraph(
            f"Chart not found: {chart_path.name}. "
            "Run visualize_results.py to generate it.",
            styles["ReportBody"],
        ))
        return

    # Preserve the chart's original aspect ratio.
    chart = Image(str(chart_path))
    chart._restrictSize(165 * mm, 78 * mm)
    chart.hAlign = "CENTER"

    story.append(chart)
    story.append(Spacer(1, 5 * mm))







def add_page_number(canvas, doc):
    canvas.saveState()

    page_width, _ = A4

    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(1)
    canvas.line(18 * mm, 15 * mm, page_width - 18 * mm, 15 * mm)

    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(DARK_GREY)
    canvas.drawString(18 * mm, 9 * mm, "RouletteIQ | Analytics Report")
    canvas.drawRightString(
        page_width - 18 * mm, 9 * mm, f"Page {doc.page}"
    )

    canvas.restoreState()


def create_report(df, output_path):
    styles = build_styles()
    story = []

    total_records = len(df)
    missing_results = int(df["Result"].isna().sum())
    duplicate_rows = int(df.duplicated().sum())

    valid_mask = (
        df["Result"].notna()
        & df["Result"].isin(VALID_NUMBERS)
        & (df["Result"] % 1 == 0)
    )

    valid_numbers = df.loc[valid_mask, "Result"].astype(int)
    invalid_count = int(
        (
            df["Result"].notna()
            & ~(
                df["Result"].isin(VALID_NUMBERS)
                & (df["Result"] % 1 == 0)
            )
        ).sum()
    )

    # Cover page
    story.append(Spacer(1, 38 * mm))
    story.append(Paragraph("ROULETTEIQ", styles["CoverTitle"]))
    story.append(Paragraph(
        "Analytics & Session Performance Report",
        styles["CoverSubtitle"],
    ))
    story.append(Spacer(1, 7 * mm))

    story.append(make_table([
        ["Report Detail", "Value"],
        ["Report generated", datetime.now().strftime("%d %B %Y, %H:%M")],
        ["Source file", "roulette-results.csv"],
        ["Total records analyzed", str(total_records)],
        ["Valid numbered outcomes", str(len(valid_numbers))],
        ["Sessions represented", str(df["Session_ID"].nunique(dropna=True))],
    ], widths=[65 * mm, 95 * mm]))

    story.append(Spacer(1, 12 * mm))
    story.append(Paragraph(
        "Purpose: summarize recorded roulette outcomes, session activity, "
        "and basic data quality using a CSV export from RouletteIQ.",
        styles["ReportBody"],
    ))
    story.append(Paragraph(
        "Interpretation note: this report describes historical records. "
        "It does not predict future roulette outcomes.",
        styles["ReportBody"],
    ))

    story.append(PageBreak())

    # Executive summary and data quality
    story.append(Paragraph("1. Executive Summary", styles["SectionHeading"]))

    summary_data = [
        ["Metric", "Value"],
        ["Total records", str(total_records)],
        ["Valid numbered outcomes", str(len(valid_numbers))],
        ["Missing results", str(missing_results)],
        ["Invalid numbered outcomes", str(invalid_count)],
        ["Exact duplicate rows", str(duplicate_rows)],
    ]

    story.append(make_table(
        summary_data, widths=[95 * mm, 65 * mm]
    ))
    story.append(Spacer(1, 5 * mm))

    story.append(Paragraph("Data-quality observations", styles["SubHeading"]))

    notes = [
        f"The export contains {total_records} records.",
        f"{missing_results} records have no numeric Result value. "
        "These may include color-only outcomes; verify them against "
        "the original application records.",
        f"{invalid_count} non-missing Result values fall outside the "
        "valid integer range from 0 to 36.",
        f"{duplicate_rows} exact duplicate rows were found.",
    ]

    for note in notes:
        story.append(Paragraph(f"• {note}", styles["ReportBody"]))

    story.append(PageBreak())

    # Number frequency
    story.append(Paragraph("2. Number Frequency", styles["SectionHeading"]))

    if not valid_numbers.empty:
        frequencies = (
            valid_numbers.value_counts()
            .reindex(range(37), fill_value=0)
            .sort_index()
        )

        frequency_rows = [["Number", "Observed Count"]]
        frequency_rows.extend([
            [str(number), str(int(frequencies[number]))]
            for number in range(37)
        ])

        story.append(Paragraph(
            f"Valid numbered outcomes included in this table: "
            f"{len(valid_numbers)}.",
            styles["ReportBody"],
        ))

        story.append(make_table(
            frequency_rows, widths=[45 * mm, 45 * mm]
        ))

        top_five = frequencies.sort_values(
            ascending=False, kind="stable"
        ).head(5)

        story.append(Spacer(1, 5 * mm))
        story.append(Paragraph("Most frequent observed numbers", styles["SubHeading"]))
        story.append(make_table(
            [["Number", "Observed Count"]]
            + [[str(n), str(int(c))] for n, c in top_five.items()],
            widths=[45 * mm, 45 * mm],
        ))
    else:
        story.append(Paragraph(
            "No valid numbered outcomes were available.",
            styles["ReportBody"],
        ))

    story.append(Spacer(1, 5 * mm))
    story.append(Paragraph(
        "Observed frequency is descriptive, not predictive. In a fair "
        "European roulette wheel, each number has probability 1/37 per "
        "spin, independently of previous outcomes.",
        styles["SmallNote"],
    ))

    story.append(PageBreak())

    # Charts
    story.append(Paragraph("3. Visual Analysis", styles["SectionHeading"]))

    add_chart(
        story, "3.1 Number Frequency",
        CHARTS["Number Frequency"], styles
    )

    add_chart(
        story, "3.2 Recorded Color Distribution",
        CHARTS["Color Distribution"], styles
    )

    story.append(PageBreak())

    add_chart(
        story, "3.3 Session Comparison",
        CHARTS["Session Comparison"], styles
    )

    # Color and parity tables
    story.append(Paragraph("4. Outcome Categories", styles["SectionHeading"]))

    for column, title in [
        ("Color", "Recorded color counts"),
        ("Parity", "Recorded parity counts"),
    ]:
        counts = df[column].fillna("Missing").value_counts(dropna=False)

        story.append(Paragraph(title, styles["SubHeading"]))
        story.append(make_table(
            [[column, "Count"]]
            + [[str(label), str(int(count))]
               for label, count in counts.items()],
            widths=[75 * mm, 45 * mm],
        ))
        story.append(Spacer(1, 5 * mm))

    story.append(PageBreak())

    # Sessions
    story.append(Paragraph("5. Session Analysis", styles["SectionHeading"]))

    session_df = df.copy()
    session_df["Session_ID"] = (
        session_df["Session_ID"].fillna("Unassigned")
    )
    session_df["_valid_result"] = valid_mask.astype(int)

    session_summary = session_df.groupby(
        "Session_ID", dropna=False
    ).agg(
        total_records=("Spin_Number", "count"),
        valid_results=("_valid_result", "sum"),
        missing_results=("Result", lambda s: int(s.isna().sum())),
    ).reset_index()

    session_rows = [
        ["Session ID", "Records", "Valid", "Missing"]
    ]

    session_rows.extend([
        [
            str(row["Session_ID"]),
            str(int(row["total_records"])),
            str(int(row["valid_results"])),
            str(int(row["missing_results"])),
        ]
        for _, row in session_summary.iterrows()
    ])

    story.append(make_table(
        session_rows,
        widths=[75 * mm, 27 * mm, 27 * mm, 27 * mm],
    ))

    valid_dates = df["Timestamp"].dropna()

    story.append(Spacer(1, 7 * mm))
    story.append(Paragraph("Reporting period", styles["SubHeading"]))

    if not valid_dates.empty:
        story.append(Paragraph(
            f"Earliest timestamp (UTC): {valid_dates.min()}<br/>"
            f"Latest timestamp (UTC): {valid_dates.max()}",
            styles["ReportBody"],
        ))
    else:
        story.append(Paragraph(
            "No valid timestamps were available.",
            styles["ReportBody"],
        ))

    story.append(Spacer(1, 8 * mm))
    story.append(Paragraph("Limitations", styles["SubHeading"]))
    story.append(Paragraph(
        "This report summarizes only the records in the supplied CSV. "
        "It does not establish causation, guarantee data completeness, "
        "or forecast future spins. Confirm missing-result records and "
        "session assignments against RouletteIQ before using the report "
        "for operational decisions.",
        styles["ReportBody"],
    ))

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=22 * mm,
        title="RouletteIQ Analytics Report",
        author="RouletteIQ",
    )

    doc.build(
        story,
        onFirstPage=add_page_number,
        onLaterPages=add_page_number,
    )


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate a PDF report from RouletteIQ analytics."
    )
    parser.add_argument(
        "csv_file",
        nargs="?",
        default=str(BASE_DIR / "roulette-results.csv"),
        help="Path to RouletteIQ CSV export",
    )
    args = parser.parse_args()

    try:
        df = load_data(Path(args.csv_file))
        output_path = BASE_DIR / "RouletteIQ_Analytics_Report.pdf"
        create_report(df, output_path)

        print("\nPDF report created successfully!")
        print(f"Output: {output_path.resolve()}")

    except (FileNotFoundError, ValueError, pd.errors.ParserError) as exc:
        raise SystemExit(f"Report generation failed: {exc}")


if __name__ == "__main__":
    main()
