
from pathlib import Path
import argparse
import pandas as pd
import matplotlib.pyplot as plt

VALID_NUMBERS = range(37)


def main():
    parser = argparse.ArgumentParser(
        description="Create charts from RouletteIQ CSV data."
    )
    parser.add_argument("csv_file")
    args = parser.parse_args()

    csv_path = Path(args.csv_file)

    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    df = pd.read_csv(csv_path)

    required = {"Result", "Color", "Session_ID"}
    missing = required - set(df.columns)

    if missing:
        raise ValueError(f"Missing columns: {sorted(missing)}")

    output_dir = Path("analytics")
    output_dir.mkdir(exist_ok=True)

    # Chart 1: Number frequency
    results = pd.to_numeric(df["Result"], errors="coerce")
    valid = results[
        results.isin(VALID_NUMBERS)
        & (results % 1 == 0)
    ].astype(int)

    frequency = (
        valid.value_counts()
        .reindex(VALID_NUMBERS, fill_value=0)
        .sort_index()
    )

    plt.figure(figsize=(13, 6))
    frequency.plot(kind="bar")
    plt.title("RouletteIQ: Number Frequency")
    plt.xlabel("Roulette Number")
    plt.ylabel("Observed Count")
    plt.tight_layout()
    plt.savefig(output_dir / "number_frequency.png", dpi=160)
    plt.close()

    # Chart 2: Recorded color counts
    color_counts = df["Color"].dropna().str.lower().value_counts()
    color_order = [
        color for color in ["red", "black", "green"]
        if color in color_counts.index
    ]

    if color_order:
        color_values = [color_counts[color] for color in color_order]
        color_map = {
            "red": "#dc4444",
            "black": "#333333",
            "green": "#269b68",
        }

        plt.figure(figsize=(7, 7))
        plt.pie(
    color_values,
    labels=color_order,
    autopct="%1.1f%%",
    colors=[color_map[color] for color in color_order],
    startangle=90,
)
        plt.axis("equal")
        plt.title("RouletteIQ: Recorded Color Counts")
        plt.tight_layout()
        plt.savefig(output_dir / "color_distribution.png", dpi=160)
        plt.close()

    # Chart 3: Record counts by session
    session_counts = (
        df["Session_ID"]
        .fillna("Unassigned")
        .value_counts()
    )

    plt.figure(figsize=(10, 6))
    session_counts.plot(kind="bar")
    plt.title("RouletteIQ: Records by Session")
    plt.xlabel("Session ID")
    plt.ylabel("Number of Records")
    plt.xticks(rotation=30, ha="right")
    plt.tight_layout()
    plt.savefig(output_dir / "session_comparison.png", dpi=160)
    plt.close()

    print("Charts created successfully:")
    print(output_dir / "number_frequency.png")
    print(output_dir / "color_distribution.png")
    print(output_dir / "session_comparison.png")


if __name__ == "__main__":
    main()
