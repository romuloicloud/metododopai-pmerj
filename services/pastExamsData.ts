import { Exam } from '../types';
import { soldado2023Questions } from './data_soldado_2023';

export const pastExamsData: Exam[] = [
    {
        id: 'pmerj-2024',
        name: 'Prova PMERJ 2024 (FGV)',
        year: 2024,
        questions: []
    },
    {
        id: 'sd-pmerj-2023',
        name: 'Prova Soldado PMERJ 2023 (IBADE)',
        year: 2023,
        questions: soldado2023Questions
    }
];
