# scripts/00_environment_setup.R – Phase 00: Environment & Scaffold

# ------------------------------------------------------------
# This script sets up a reproducible R environment, installs required
# packages, creates the project folder scaffold, writes a Dockerfile,
# CI workflow, and a .Renviron template.
# ------------------------------------------------------------

# ---- 1. Initialise renv -------------------------------------
if (!requireNamespace("renv", quietly = TRUE)) {
  install.packages("renv")
}
renv::init(bare = TRUE)  # initialise without auto‑installing packages

# ---- 2. Install required packages ---------------------------
pkgs <- c(
  # Match data
  "worldfootballR", "rvest", "StatsBombR",
  # Geospatial
  "tidygeocoder", "geosphere",
  # API clients
  "httr2", "jsonlite",
  # Data wrangling
  "tidyverse", "lubridate", "janitor",
  # Modelling
  "lme4", "lmerTest", "MASS", "broom.mixed", "car",
  # Reporting & dashboard
  "rmarkdown", "knitr", "kableExtra", "shiny", "quarto",
  # Testing & infra
  "testthat", "usethis", "cli", "glue", "renv"
)
install.packages(pkgs)

# Snapshot the installed packages into renv.lock
renv::snapshot()

# ---- 3. Create folder scaffold ------------------------------
folders <- c(
  "scripts",
  "data_raw/kaggle",
  "data_raw/statsbomb",
  "data_interim",
  "data_final",
  "logs",
  "tests/testthat",
  "docs",
  ".github/workflows"
)
for (f in folders) {
  dir.create(f, recursive = TRUE, showWarnings = FALSE)
}

# ---- 4. Write Dockerfile -----------------------------------
docker_content <- """
FROM rocker/rstudio:4.3.0
WORKDIR /home/rstudio/project
COPY renv.lock ./
RUN R -e \"install.packages('renv'); renv::restore()\"
COPY . .
CMD [\"Rscript\", \"scripts/run_all.R\"]
"""
writeLines(docker_content, "Dockerfile")

# ---- 5. CI workflow (GitHub Actions) ----------------------
ci_content <- """
name: R CI
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: r-lib/actions/setup-r@v2
      - uses: r-lib/actions/setup-pandoc@v2
      - uses: r-lib/actions/setup-r-dependencies@v2
      - run: Rscript -e 'renv::restore()'
      - run: Rscript -e 'devtools::test()'
      - run: Rscript -e 'source("scripts/run_all.R")'
"""
writeLines(ci_content, "\.github/workflows/ci.yml")

# ---- 6. .Renviron template (git‑ignored) -------------------
renv_template <- "METEOSTAT_KEY=your_rapidapi_key_here"
writeLines(renv_template, ".Renviron")

# ---- 7. .gitignore entry for .Renviron --------------------
gitignore_path <- ".gitignore"
if (!file.exists(gitignore_path)) {
  writeLines("", gitignore_path)
}
gitignore <- readLines(gitignore_path)
if (!".Renviron" %in% gitignore) {
  writeLines(c(gitignore, ".Renviron"), gitignore_path)
}

message("Phase 00 setup complete. Check the project root for the created files and folders.")

# ------------------------------------------------------------
# End of 00_environment_setup.R
# ------------------------------------------------------------
