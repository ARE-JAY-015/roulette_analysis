
from pathlib import Path
import argparse
import pandas as pd

VALID_NUMBERS = set(range(37))


def load_results(csv_path):
    path = Path(csv_path)

    if not path.exists():
        raise FileNotFoundError(f"CSV file not found: {path}")

    df = pd.read_csv(path)

    required = {
        "Spin_Number",
        "Result",
        "Color",
        "Parity",
        "Timestamp",
        "Session_ID",
    }

    missing_columns = required - set(df.columns)

    if missing_columns:
        raise ValueError(
            f"Missing expected columns: {sorted(missing_columns)}"
        )

    if df.empty:
        raise ValueError("The CSV contains no records.")

    df["Result"] = pd.to_numeric(df["Result"], errors="coerce")

    df["Timestamp"] = pd.to_datetime(
        df["Timestamp"], errors="coerce", utc=True
    )

    return df


def analyze_results(df):
    print("\n===== ROULETTEIQ DATA REPORT =====")
    print(f"Total records: {len(df)}")

    print("\nMissing values by column:")
    print(df.isna().sum().to_string())

    print(f"\nExact duplicate rows: {df.duplicated().sum()}")

    # Validate and analyze numbered outcomes.
    valid_mask = (
        df["Result"].notna()
        & df["Result"].isin(VALID_NUMBERS)
        & (df["Result"] % 1 == 0)
    )

    numbers = df.loc[valid_mask, "Result"].astype(int)

    invalid_count = (
        df["Result"].notna()
        & ~df["Result"].isin(VALID_NUMBERS)
    ).sum()

    print(f"\nValid numbered outcomes: {len(numbers)}")
    print(f"Missing results: {df['Result'].isna().sum()}")
    print(f"Invalid results: {invalid_count}")

    if not numbers.empty:
        frequencies = (
            numbers.value_counts()
            .reindex(range(37), fill_value=0)
            .sort_index()
        )

        print("\nFrequency of every roulette number:")
        print(frequencies.to_string())

        print("\nFive most frequent observed numbers:")
        print(frequencies.sort_values(ascending=False).head(5).to_string())

    print("\nColor counts:")
    print(df["Color"].value_counts(dropna=False).to_string())

    print("\nParity counts:")
    print(df["Parity"].value_counts(dropna=False).to_string())

    print("\nRecords by session:")
    print(
        df["Session_ID"]
        .fillna("Unassigned")
        .value_counts()
        .to_string()
    )

    print("\nSession summary:")
    session_summary = df.groupby("Session_ID", dropna=False).agg(
        total_records=("Spin_Number", "count"),
        valid_results=("Result", "count"),
    )
    print(session_summary.to_string())

    valid_dates = df["Timestamp"].dropna()

    if not valid_dates.empty:
        print("\nDate range:")
        print(f"First: {valid_dates.min()}")
        print(f"Last:  {valid_dates.max()}")

    print("\nNote: Historical frequencies describe past records.")
    print("They do not predict the next roulette outcome.")


def main():
    parser = argparse.ArgumentParser(
        description="Analyze a RouletteIQ CSV export."
    )
    parser.add_argument("csv_file", help="Path to the exported CSV")
    args = parser.parse_args()

    try:
        df = load_results(args.csv_file)
        analyze_results(df)
    except (FileNotFoundError, ValueError, pd.errors.ParserError) as exc:
        raise SystemExit(f"Analysis failed: {exc}")


if __name__ == "__main__":
    main()
