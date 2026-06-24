# 07_models.R

# Load required libraries
library(lme4)
library(MASS)
library(broom.mixed)
library(car)
library(tidyverse)

# Load master data
master_path <- file.path("data_final", "team_match_master_preprocessed.csv")
master <- read_csv(master_path)
# Data already imputed via KNN in the Python preprocessing step
master_imputed <- master

# -------------------------------------------------------------------
# Missing data inspection
missing_counts <- sapply(master, function(col) sum(is.na(col)))
cat("Missing values per column:\n")
print(missing_counts)
# Save summary to a file for reference
write.table(missing_counts, file = file.path("..", "docs", "missing_summary.txt"), col.names = FALSE)

# -------------------------------------------------------------------
# Simple imputation of missing values
impute_missing <- function(df) {
  # Numeric columns: median imputation
  df_num <- df %>% mutate(across(where(is.numeric), ~ifelse(is.na(.), median(., na.rm = TRUE), .)))
  # Categorical columns (character/factor): mode imputation
  df_imputed <- df_num %>% mutate(across(where(~!is.numeric(.)), ~{
    mode_val <- names(sort(table(.), decreasing = TRUE))[1]
    ifelse(is.na(.), mode_val, .)
  }))
  return(df_imputed)
}

master_imputed <- impute_missing(master)

# -------------------------------------------------------------------

# -------------------------------------------------------------------
# Helper function to clean data for a given formula (filters any remaining NAs just in case)
clean_data_for_formula <- function(df, formula) {
  vars <- all.vars(formula)
  # Subset to needed variables
  df_sub <- df %>% select(all_of(vars))
  # Convert logicals to integer, characters to numeric factor codes, and any factors to numeric
  df_clean <- df_sub %>%
    mutate(across(where(is.logical), as.integer)) %>%
    mutate(across(where(is.character), ~as.numeric(as.factor(.)))) %>%
    mutate(across(where(is.factor), ~as.numeric(.)))
  # Drop rows with any NA in the selected variables
  df_clean <- df_clean %>% filter_at(vars, all_vars(!is.na(.)))
  return(df_clean)
}
# -------------------------------------------------------------------


# Helper function to fit model with fallback to Poisson if NB fails
fit_nb_or_poisson <- function(formula, data) {
  tryCatch({
    glm.nb(formula, data = data)
  }, error = function(e) {
    message("glm.nb failed: ", e$message, " – using Poisson.")
    glm(formula, data = data, family = poisson())
  })
}

# Helper function to fit GLMM NB or fallback to Poisson GLMM
fit_glmm_nb_or_poisson <- function(formula, data) {
  tryCatch({
    glmer.nb(formula, data = data)
  }, error = function(e) {
    message("glmer.nb failed: ", e$message, " – using Poisson GLMM.")
    glmer(formula, data = data, family = poisson())
  })
}

# -------------------------------------------------------------------
# Fit models using the imputed dataset
# M1: elevation only
m1_data <- clean_data_for_formula(master_imputed, goals_against_2h ~ elevation_m)
if (nrow(m1_data) > 0) {
  m1 <- fit_nb_or_poisson(goals_against_2h ~ elevation_m, m1_data)
} else {
  message("Insufficient data for M1 after NA filtering.")
  m1 <- NULL
}

# M2: elevation + elo_diff
m2_data <- clean_data_for_formula(master_imputed, goals_against_2h ~ elevation_m + elo_diff)
if (nrow(m2_data) > 0) {
  m2 <- fit_nb_or_poisson(goals_against_2h ~ elevation_m + elo_diff, m2_data)
} else {
  message("Insufficient data for M2 after NA filtering.")
  m2 <- NULL
}

# M3: full fixed-effects model
m3_formula <- goals_against_2h ~ elevation_m + temp_c + humidity + elo_diff + adapted_flag + rest_days + travel_km + year
m3_data <- clean_data_for_formula(master_imputed, m3_formula)
if (nrow(m3_data) > 0) {
  m3 <- fit_nb_or_poisson(m3_formula, m3_data)
} else {
  message("Insufficient data for M3 after NA filtering.")
  m3 <- NULL
}

# M4: GLMM with random intercept for year (only if multiple years)
m4_formula <- goals_against_2h ~ elevation_m + temp_c + elo_diff + adapted_flag + rest_days + travel_km + (1 | year)
m4_data <- clean_data_for_formula(master_imputed, m4_formula)
if (nrow(m4_data) > 0 && length(unique(m4_data$year)) > 1) {
  m4 <- fit_glmm_nb_or_poisson(m4_formula, m4_data)
} else {
  message("Insufficient data or not enough year levels for M4; skipping GLMM.")
  m4 <- NULL
}

# M5: Interaction altitude*temperature + other covariates, GLMM (only if multiple years)
m5_formula <- goals_against_2h ~ elevation_m * temp_c + elo_diff + adapted_flag + rest_days + travel_km + (1 | year)
m5_data <- clean_data_for_formula(master_imputed, m5_formula)
if (nrow(m5_data) > 0 && length(unique(m5_data$year)) > 1) {
  m5 <- fit_glmm_nb_or_poisson(m5_formula, m5_data)
} else {
  message("Insufficient data or not enough year levels for M5; skipping GLMM.")
  m5 <- NULL
}

# -------------------------------------------------------------------
# Save model objects
model_dir <- file.path("..", "models")
if (!dir.exists(model_dir)) dir.create(model_dir, recursive = TRUE)
if (!is.null(m1)) saveRDS(m1, file.path(model_dir, "m1.rds"))
if (!is.null(m2)) saveRDS(m2, file.path(model_dir, "m2.rds"))
if (!is.null(m3)) saveRDS(m3, file.path(model_dir, "m3.rds"))
if (!is.null(m4)) saveRDS(m4, file.path(model_dir, "m4.rds"))
if (!is.null(m5)) saveRDS(m5, file.path(model_dir, "m5.rds"))

# -------------------------------------------------------------------
# Diagnostics summary
diag_path <- file.path("..", "docs", "model_diagnostics.md")
cat("# Model Diagnostics\n\n", file = diag_path)

# VIF for fixed-effects (M3) if available
if (!is.null(m3)) {
  cat("## VIF (M3)\n", file = diag_path, append = TRUE)
  cat(capture.output(car::vif(m3)), sep = "\n", file = diag_path, append = TRUE)
  cat("\n\n", file = diag_path, append = TRUE)
}

# AIC comparison for fitted models
fitted_models <- list(m1, m2, m3, m4, m5)
model_names <- c("m1", "m2", "m3", "m4", "m5")
valid_idx <- which(sapply(fitted_models, function(m) !is.null(m)))
if (length(valid_idx) > 0) {
  cat("## AIC Comparison\n", file = diag_path, append = TRUE)
  aic_vals <- sapply(fitted_models[valid_idx], AIC)
  aic_tbl <- data.frame(Model = model_names[valid_idx], AIC = aic_vals)
  print(aic_tbl)
  cat(capture.output(aic_tbl), sep = "\n", file = diag_path, append = TRUE)
  cat("\n\n", file = diag_path, append = TRUE)
}

# Residual plot for primary GLMM (M4) if available
if (!is.null(m4)) {
  cat("## Residuals (M4)\n\n", file = diag_path, append = TRUE)
  png(file.path("..", "docs", "m4_residuals.png"))
  plot(m4)
  dev.off()
  cat("![](m4_residuals.png)\n", file = diag_path, append = TRUE)
}

cat("\nAll models processed. Diagnostics written to model_diagnostics.md.\n", file = diag_path, append = TRUE)
