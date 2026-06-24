library(testthat)

test_that("Phase 04 output files exist and are valid", {
  path <- file.path("data_interim", "venues_climate.csv")
  if (!file.exists(path) && file.exists(file.path("..", "..", path))) {
    path <- file.path("..", "..", path)
  }
  expect_true(file.exists(path), label = "venues_climate.csv exists")
  df <- read.csv(path)
  # Ensure columns exist
  expect_true("temp_c" %in% colnames(df))
  expect_true("rh_pct" %in% colnames(df))
  # Validation bounds
  expect_true(all(df$temp_c >= -10 & df$temp_c <= 50))
  expect_true(all(df$rh_pct >= 0 & df$rh_pct <= 100))
})
