import sys
import time
from docx2pdf import convert

start = time.time()
try:
    convert("scratch/test_input.docx", "scratch/test_local_out.pdf")
    print(f"SUCCESS in {time.time() - start:.2f}s")
except Exception as e:
    print(f"FAILED: {e}")
