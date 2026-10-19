import pypdf

reader = pypdf.PdfReader(r'C:\Users\Sahil Kalathiya\.gemini\antigravity-ide\brain\6ea3d352-6314-4d86-add8-fa8f44f98282\.user_uploaded\media_1792404302683.pdf')
for idx, page in enumerate(reader.pages):
    text = page.extract_text() or ''
    lines = [l for l in text.split('\n') if 'default' in l.lower()]
    if lines:
        print(f'=== PAGE {idx+1} ===')
        for l in lines:
            print(' ', l.strip())
