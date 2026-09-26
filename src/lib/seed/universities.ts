/**
 * Universidades e campi iniciais (usados pelo `npm run db:seed`).
 *
 * - `emailDomain`: domínio do e-mail institucional dos ALUNOS, que é o que o
 *   cadastro aceita (ver src/lib/auth/email-domain.ts). Só entra universidade
 *   com domínio confirmado em fonte oficial.
 * - Coordenadas: OpenStreetMap (Nominatim), consultado em 25/09/2026.
 *
 * Os `id`s são fixos para o seed poder rodar várias vezes sem duplicar.
 */
export type SeedCampus = {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
};

export type SeedUniversity = {
  id: string;
  name: string;
  acronym: string;
  emailDomain: string;
  campuses: SeedCampus[];
};

export const universities: SeedUniversity[] = [
  {
    id: "ufpi",
    name: "Universidade Federal do Piauí",
    acronym: "UFPI",
    // Fonte: SIGAA UFPI, "E-mail Institucional (@ufpi.edu.br)"
    emailDomain: "ufpi.edu.br",
    campuses: [
      {
        id: "ufpi-petronio-portella",
        name: "Campus Ministro Petrônio Portella",
        city: "Teresina",
        state: "PI",
        latitude: -5.0566196,
        longitude: -42.8018295,
      },
    ],
  },
  {
    id: "uespi",
    name: "Universidade Estadual do Piauí",
    acronym: "UESPI",
    // Fonte: UESPI, "e-mail institucional para alunos" (@aluno.uespi.br)
    emailDomain: "aluno.uespi.br",
    campuses: [
      {
        // Rua João Cabral, 2231, Pirajá
        id: "uespi-torquato-neto",
        name: "Campus Poeta Torquato Neto",
        city: "Teresina",
        state: "PI",
        latitude: -5.0773073,
        longitude: -42.8268935,
      },
    ],
  },
];
