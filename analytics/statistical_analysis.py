
from pathlib import Path

import pandas as pd
from scipy.stats import chisquare

BASE_DIR = Path(__file__).resolve().parent
CSV_FILE = BASE_DIR / "roulette-results.csv"

# European roulette theoretical probabilities
PROBABILITIES = {
    "red": 18 / 37,
    "black": 18 / 37,
    "green": 1 / 37,
}


def load_data():
    """Load and validate RouletteIQ records."""

    if not CSV_FILE.exists():
        raise FileNotFoundError(f"CSV not found: {CSV_FILE}")

    df = pd.read_csv(CSV_FILE)

    if "Color" not in df.columns:
        raise ValueError("CSV must contain a Color column.")

    df["Color"] = df["Color"].astype("string").str.strip().str.lower()

    return df


def probability_analysis(df):
    """Compare observed color proportions with theoretical probabilities."""

    print("\n========== PROBABILITY DISTRIBUTION ==========")

    colors = df["Color"].dropna()
    total = len(colors)

    print(f"Total records with a color: {total}")

    observed = colors.value_counts()

    for color, probability in PROBABILITIES.items():

        count = int(observed.get(color, 0))
        expected = total * probability
        percentage = (count / total * 100) if total else 0

        print(f"\n{color.upper()}")
        print(f"Observed count: {count}")
        print(f"Observed percentage: {percentage:.2f}%")
        print(f"Theoretical probability: {probability:.4f}")
        print(f"Expected count: {expected:.2f}")


def red_black_chi_square(df):
    """Test equal red/black proportions among non-green outcomes."""

    print("\n========== RED VS BLACK CHI-SQUARE TEST ==========")

    colors = df["Color"].dropna()

    red_count = int((colors == "red").sum())
    black_count = int((colors == "black").sum())

    total = red_count + black_count

    if total == 0:
        print("No red or black observations available.")
        return

    observed = [red_count, black_count]
    expected = [total / 2, total / 2]

    print(f"Red observed: {red_count}")
    print(f"Black observed: {black_count}")
    print(f"Red expected: {expected[0]:.2f}")
    print(f"Black expected: {expected[1]:.2f}")

    if min(expected) < 5:
        print("Expected counts are too small for this test.")
        return

    statistic, p_value = chisquare(
        f_obs=observed,
        f_exp=expected
    )

    print(f"\nChi-square statistic: {statistic:.4f}")
    print(f"P-value: {p_value:.4f}")
    print("Degrees of freedom: 1")

    alpha = 0.05

    if p_value < alpha:
        print("\nDecision: Reject the null hypothesis.")
        print("There is evidence of a red/black imbalance.")
    else:
        print("\nDecision: Fail to reject the null hypothesis.")
        print("There is insufficient evidence of a red/black imbalance.")

    print("\nInterpretation:")
    print("This test examines red versus black conditional on")
    print("the recorded outcome being non-green.")
    print("It does not establish that the wheel is fair.")


def main():

    print("\n======================================")
    print(" ROULETTEIQ STATISTICAL ANALYSIS")
    print("======================================")

    try:
        df = load_data()

        probability_analysis(df)
        red_black_chi_square(df)

    except (FileNotFoundError, ValueError, pd.errors.ParserError) as error:
        print(f"\nAnalysis failed: {error}")


if __name__ == "__main__":
    main()
