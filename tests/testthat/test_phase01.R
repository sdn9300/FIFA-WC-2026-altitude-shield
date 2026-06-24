library(testthat)

# Helper to check file exists and non-zero size
check_file_nonzero <- function(path) {
  proj_path <- path
  if (!file.exists(proj_path) && file.exists(file.path("..", "..", path))) {
    proj_path <- file.path("..", "..", path)
  }
  expect_true(file.exists(proj_path), label = paste0('File does not exist: ', path))
  expect_gt(file.info(proj_path)$size, 0, label = paste0('File is empty: ', path))
}

# Paths to generated CSVs (relative to project root)
interim_dir <- file.path('data_interim')
files <- c(
  file.path(interim_dir, 'fbref_matches_raw.csv'),
  file.path(interim_dir, 'kaggle_matches_raw.csv'),
  file.path(interim_dir, 'statsbomb_xg.csv'),
  file.path(interim_dir, 'goals_df.csv')
)

for (f in files) {
  test_that(paste('Phase 01 output file exists and non-zero:', f), {
    check_file_nonzero(f)
  })
}

