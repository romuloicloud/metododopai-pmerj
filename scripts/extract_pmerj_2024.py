import re
import json

def parse_pmerj_exam(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    questions = []
    current_q = None
    state = 'SEARCHING' # SEARCHING, ENUNCIADO, OPTIONS
    
    headers_to_ignore = [
        "SECRETARIA DE ESTADO DE POLÍCIA MILITAR DO ESTADO DO RIO DE JANEIRO",
        "FGV Conhecimento",
        "Soldado Policial Militar Classe C",
        "Tipo 1  ̶  Branca",
        "Língua Portuguesa",
        "Matemática Básica",
        "Noções de Direitos Humanos",
        "Noções de Direito Administrativo",
        "Legislação Aplicada à PMERJ",
        "Noções de Direito Penal e Processual Penal"
    ]

    def is_ignore_line(line):
        line = line.strip()
        if not line: return True
        if line == '' or line == '': return True
        for h in headers_to_ignore:
            if h in line: return True
        if re.match(r'^Tipo 1.*Página \d+$', line): return True
        return False

    current_subject = 'Língua Portuguesa'
    
    expected_q_num = 1
    
    for i, line in enumerate(lines):
        orig_line = line
        line = line.strip()
        
        if not line:
            continue
            
        if "Língua Portuguesa" in line: current_subject = "Língua Portuguesa"
        elif "Matemática Básica" in line: current_subject = "Matemática Básica"
        elif "Noções de Direitos Humanos" in line: current_subject = "Direitos Humanos"
        elif "Noções de Direito Administrativo" in line: current_subject = "Direito Administrativo"
        elif "Legislação Aplicada à PMERJ" in line: current_subject = "Legislação Aplicada à PMERJ"
        elif "Noções de Direito Penal e Processual Penal" in line: current_subject = "Direito Penal"
            
        if is_ignore_line(line):
            continue

        # Look for question number
        q_match = re.match(r'^(\d+)\s*$', line)
        if q_match and len(line) < 5:
            q_num = int(q_match.group(1))
            if q_num == expected_q_num:
                if current_q:
                    questions.append(current_q)
                
                current_q = {
                    'id': f'PMERJ-2024-{q_num}',
                    'exam_year': 2024,
                    'exam_name': 'PMERJ',
                    'question_number': q_num,
                    'subject': current_subject,
                    'text': '',
                    'options': [],
                    'correct_answer': 'A' # Placeholder
                }
                state = 'ENUNCIADO'
                expected_q_num += 1
                continue
            
        if not current_q:
            continue
            
        # If it wasn't a question number, or it was but didn't match expected sequence, treat as option or text
        # Look for option format (A)
        opt_match = re.match(r'^\(([A-E])\)\s*(.*)', line)
        if opt_match:
            state = 'OPTIONS'
            current_q['options'].append(opt_match.group(2))
        elif state == 'OPTIONS':
            if current_q['options']:
                current_q['options'][-1] += " " + line
            else:
                # Fallback if somehow state is OPTIONS but list is empty
                current_q['options'].append(line)
        elif state == 'ENUNCIADO':
            if current_q['text']:
                current_q['text'] += "\n" + line
            else:
                current_q['text'] = line

    if current_q:
        questions.append(current_q)
        
    # Formatting fixes
    for q in questions:
        q['text'] = q['text'].replace('\n', ' ').strip()
        q['options'] = [o.strip() for o in q['options']]

    with open('pmerj_2024_parsed.json', 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
        
    print(f"Extracted {len(questions)} questions.")

if __name__ == '__main__':
    parse_pmerj_exam('C:/tmp/prova_fgv_pmerj_tipo1.txt')
