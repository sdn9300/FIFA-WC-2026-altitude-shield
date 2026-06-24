import kagglehub, os, pandas as pd

# Download dataset
path = kagglehub.dataset_download("afonsofernandescruz/2026-fifa-world-cup-historical-elo-ratings")
print("Dataset downloaded to:", path)

# Locate CSV file(s)
csv_files = [f for f in os.listdir(path) if f.lower().endswith('.csv')]
if not csv_files:
    print("No CSV files found in the dataset.")
else:
    csv_path = os.path.join(path, csv_files[0])
    df = pd.read_csv(csv_path)
    print("Columns:", list(df.columns))
    print("Number of rows:", len(df))
    print("First 5 rows:")
    print(df.head())
