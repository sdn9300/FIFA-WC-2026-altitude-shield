# scripts/05_capital_elevation.R

# Phase 05 – Capital City Elevation Data Collection
# This script retrieves the list of capital cities by elevation from Wikipedia,
# extracts the relevant table, cleans the data, and writes it to
# `data_interim/capital_elevations.csv`.

# Install required packages if not already installed
required_pkgs <- c("rvest", "dplyr", "readr", "stringr")
installed <- rownames(installed.packages())
for (pkg in required_pkgs) {
  if (!pkg %in% installed) {
    install.packages(pkg, dependencies = TRUE)
  }
}

library(rvest)
library(dplyr)
library(readr)
library(stringr)

# Wikipedia page URL
wiki_url <- "https://en.wikipedia.org/wiki/List_of_capital_cities_by_elevation"

# Read the page and extract the first sortable wikitable
page <- read_html(wiki_url)
tables <- html_nodes(page, "table.wikitable.sortable")
if (length(tables) == 0) {
  stop("No sortable wikitable found on the Wikipedia page.")
}
# The first table contains the capital city list
capitals_tbl <- html_table(tables[[1]], fill = TRUE)

# Clean column names (the table usually has: "Country", "Capital", "Elevation (m)", …)
colnames(capitals_tbl) <- make.names(colnames(capitals_tbl), unique = TRUE)

# Identify the columns for country, capital, and elevation
elev_col <- grep("elevation", names(capitals_tbl), ignore.case = TRUE, value = TRUE)[1]
country_col <- grep("country", names(capitals_tbl), ignore.case = TRUE, value = TRUE)[1]
capital_col <- grep("capital", names(capitals_tbl), ignore.case = TRUE, value = TRUE)[1]

if (any(is.na(c(elev_col, country_col, capital_col)))) {
  stop("Unable to locate required columns in the Wikipedia table.")
}

clean_df <- capitals_tbl %>%
  select(Country = !!sym(country_col), Capital = !!sym(capital_col), Elevation_m = !!sym(elev_col)) %>%
  mutate(
    Elevation_m = as.numeric(str_extract(Elevation_m, "[-+]?[0-9]+")),
    Country = str_trim(Country),
    Capital = str_trim(Capital)
  ) %>%
  arrange(desc(Elevation_m))

# Output path – relative to project root
output_path <- file.path("data_interim", "capital_elevations.csv")

write_csv(clean_df, output_path)

cat("Capital city elevation data written to", output_path, "\n")
