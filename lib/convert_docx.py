import sys
import os
from docx2pdf import convert

def main():
    if len(sys.argv) < 3:
        print("Usage: python convert_docx.py <input.docx> <output.pdf>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    if not os.path.exists(input_path):
        print(f"Error: Input file '{input_path}' does not exist.")
        sys.exit(1)

    try:
        convert(input_path, output_path)
        print(f"SUCCESS: Converted '{input_path}' to '{output_path}'")
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
