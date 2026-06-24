library(quarto)
# Render the Quarto report (HTML only)
quarto_render(input = "docs/report.qmd", output_format = "html")
# Copy the generated HTML to the Next.js public folder for serving
file.copy(from = "docs/report.html", to = "public/report.html", overwrite = TRUE)
