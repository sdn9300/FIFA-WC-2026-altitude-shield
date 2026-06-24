# 07_eda.py
"""Simple EDA script for Phase 7.
Generates a basic HTML report with:
- Data preview (head)
- Summary statistics (describe)
- Missing value counts
- Histograms for numeric columns (saved as PNGs and embedded)
The report is saved to docs/07_eda_report.html.
"""
import os
import pandas as pd
import matplotlib.pyplot as plt

# Paths
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
master_path = os.path.join(project_root, "data_final", "team_match_master.csv")
report_path = os.path.join(project_root, "docs", "07_eda_report.html")
images_dir = os.path.join(project_root, "docs", "eda_images")
os.makedirs(images_dir, exist_ok=True)

# Load data
df = pd.read_csv(master_path)

# HTML report start
html_parts = []
html_parts.append("<h1>Phase 07 EDA Report</h1>")

# Data preview
html_parts.append("<h2>Data preview (first 5 rows)</h2>")
html_parts.append(df.head().to_html(index=False))

# Summary statistics for numeric columns
numeric_cols = df.select_dtypes(include="number").columns
if len(numeric_cols) > 0:
    html_parts.append("<h2>Summary statistics (numeric columns)</h2>")
    html_parts.append(df[numeric_cols].describe().to_html())

# Missing value counts
missing_counts = df.isna().sum()
html_parts.append("<h2>Missing values per column</h2>")
html_parts.append(missing_counts.to_frame(name="Missing").to_html())

# Histograms for numeric columns
html_parts.append("<h2>Histograms</h2>")
for col in numeric_cols:
    plt.figure(figsize=(6,4))
    df[col].hist(bins=30)
    plt.title(f"Histogram of {col}")
    plt.tight_layout()
    img_path = os.path.join(images_dir, f"{col}_hist.png")
    plt.savefig(img_path)
    plt.close()
    rel_path = os.path.relpath(img_path, os.path.dirname(report_path))
    html_parts.append(f"<h3>{col}</h3><img src=\"{rel_path}\" alt=\"{col} histogram\" style=\"max-width:600px;\"/>")

# Write report
with open(report_path, "w", encoding="utf-8") as f:
    f.write("\n".join(html_parts))
print(f"EDA report written to {report_path}")
