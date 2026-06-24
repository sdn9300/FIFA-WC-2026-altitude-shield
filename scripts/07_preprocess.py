# 07_preprocess.py
"""Preprocess the master CSV for Phase 7.
- Generates missing‑value summary saved to docs/missing_summary.txt
- Converts categorical columns to numeric codes
- Applies K‑Nearest Neighbours imputation (n_neighbors=5)
- Writes cleaned data to data_final/team_match_master_preprocessed.csv
"""
import pandas as pd
import numpy as np
from sklearn.impute import KNNImputer
from sklearn.preprocessing import OrdinalEncoder
import os

# Paths
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
master_path = os.path.join(project_root, "data_final", "team_match_master.csv")
output_path = os.path.join(project_root, "data_final", "team_match_master_preprocessed.csv")
summary_path = os.path.join(project_root, "docs", "missing_summary.txt")

# Load data
df = pd.read_csv(master_path)

# Missing‑value summary
missing_counts = df.isna().sum()
missing_counts.to_csv(summary_path, header=False)
print("Missing value summary written to", summary_path)

# Identify categorical columns (object or categorical dtype)
cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
num_cols = df.select_dtypes(include=[np.number]).columns.tolist()

# Encode categorical columns to integers (OrdinalEncoder)
if cat_cols:
    encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    df[cat_cols] = encoder.fit_transform(df[cat_cols].astype(str))
    # Replace any remaining NaNs (e.g., from all‑NA columns) with -1
    df[cat_cols] = df[cat_cols].fillna(-1)

# Combine all data for KNN imputation
imputer = KNNImputer(n_neighbors=5, weights="distance")
imputed_array = imputer.fit_transform(df)

df_imputed = pd.DataFrame(imputed_array, columns=df.columns)

# Post‑process: ensure integer columns stay integer where appropriate
for col in cat_cols:
    # Round to nearest integer and cast to int
    df_imputed[col] = np.rint(df_imputed[col]).astype(int)
    # If a column now has a single unique value, keep as numeric (R will treat as numeric)

# Save the cleaned dataset
df_imputed.to_csv(output_path, index=False)
print("Preprocessed data saved to", output_path)
