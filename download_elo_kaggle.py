# download_elo_kaggle.py
import kagglehub
import os

# Download the dataset; returns path to extracted folder
path = kagglehub.dataset_download("afonsofernandescruz/2026-fifa-world-cup-historical-elo-ratings")
print("Dataset path:", path)
# List files for debugging
for root, dirs, files in os.walk(path):
    for f in files:
        print(os.path.join(root, f))
