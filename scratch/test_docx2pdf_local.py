import time
import sys
from docx2pdf import convert

start = time.time()
print("Converting scratch/test_convert_pdf.mjs to PDF if docx exists...")
# Let's test on a real docx
import os
if os.path.exists("scratch/document.docx"):
    convert("scratch/document.docx", "scratch/test_local.pdf")
    print(f"Done in {time.time() - start:.2f}s")
else:
    print("scratch/document.docx does not exist")
