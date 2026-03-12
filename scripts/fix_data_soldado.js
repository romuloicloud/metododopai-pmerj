const fs = require('fs');
const filepath = 'services/data_soldado_2023.ts';

let content = fs.readFileSync(filepath, 'utf8');

content = content.replace(/subject: "Noções de Direitos Humanos" as const,/g, 'subject: "Direitos Humanos" as const,');
content = content.replace(/subject: "Noções de Direitos Administrativo e a Legislação Aplicada à PMERJ" as const,/g, 'subject: "Legislação Aplicada à PMERJ" as const,');
content = content.replace(/subject: "Noções de Direito Penal e Processual Penal" as const,/g, 'subject: "Legislação Aplicada à PMERJ" as const,');

fs.writeFileSync(filepath, content, 'utf8');
console.log('Fixed subjects in data_soldado_2023.ts!');
