# scripts/run_phase_01.R – Wrapper to invoke Python ingestion

message("Running Phase 01 data ingestion via Python...")

# Use system2 to call the Python script; capture output for debugging
output <- system2("python", args = file.path("scripts", "01_match_data_py.py"), stdout = TRUE, stderr = TRUE)

cat(output, sep = "\n")

message("Phase 01 completed.")
