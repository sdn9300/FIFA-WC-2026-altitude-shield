# run_phase_07.R

# This script executes Phase 07 – Exploratory Data Analysis and Statistical Modelling.

# 1. Run Python preprocessing (numeric conversion + KNN imputation)
if (Sys.which("python") != "") {
  preprocess_res <- system2("python", args = file.path("scripts", "07_preprocess.py"), stdout = TRUE, stderr = TRUE)
  cat(preprocess_res, sep = "\n")
} else {
  message("Python executable not found – skipping preprocessing step.")
}

# 2. Run Python EDA script to generate HTML report using pandas‑profiling
if (Sys.which("python") != "") {
  eda_res <- system2("python", args = file.path("scripts", "07_eda.py"), stdout = TRUE, stderr = TRUE)
  cat(eda_res, sep = "\n")
} else {
  message("Python executable not found – skipping EDA report generation.")
}

# 3. Run the modelling script which fits the five models and saves diagnostics
source(file.path("scripts", "07_models.R"))
