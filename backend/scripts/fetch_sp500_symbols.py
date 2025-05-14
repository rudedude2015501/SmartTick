import os
import pandas as pd
from typing import List

def fetch_sp500_symbols(
    filename: str = "constituents.csv"
) -> List[str]:
    """
    Reads `data/constituents.csv` and returns a list of symbols.
    """
    here = os.path.dirname(__file__)
    project_root = os.path.abspath(os.path.join(here, os.pardir))
    csv_path = os.path.join(project_root, "data", filename)

    df = pd.read_csv(csv_path)
    return df["Symbol"].str.strip().tolist()