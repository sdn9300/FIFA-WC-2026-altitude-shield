library(testthat)

test_that("Phase 03 output files exist and are valid", {
  path <- file.path("data_interim", "venues_elevation.csv")
  if (!file.exists(path) && file.exists(file.path("..", "..", path))) {
    path <- file.path("..", "..", path)
  }
  
  expect_true(file.exists(path), label = "venues_elevation.csv exists")
  df <- read.csv(path)
  
  # Ensure the necessary columns exist
  expect_true("elevation_m" %in% colnames(df))
  
  # Validation: No negative values
  expect_true(all(df$elevation_m >= 0, na.rm = TRUE))
  
  # Validation: Mexico City stadiums are correct
  mc_df <- df[df$city == "Mexico City", ]
  if (nrow(mc_df) > 0) {
    expect_true(all(mc_df$elevation_m >= 2100 & mc_df$elevation_m <= 2400))
  }
})
