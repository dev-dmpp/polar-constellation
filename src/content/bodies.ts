/**
 * Real content from David's CV. Each entry maps to a celestial body
 * in the constellation. The star of the system is the personal intro.
 */

export interface BodyContent {
  id: string;
  kind: 'star' | 'planet' | 'moon' | 'comet' | 'nebula' | 'ufo';
  name: string;
  subtitle: string;
  description: string;
  details?: Array<{ k: string; v: string }>;
  links?: Array<{ label: string; url: string }>;
  /** Hint text shown in HUD when orbiting. */
  orbitHint?: string;
}

export const CONTENT: BodyContent[] = [
  {
    id: 'polar',
    kind: 'star',
    name: 'Polar',
    subtitle: 'Estrella central — quién soy',
    description: `David M. Pollard P. Desarrollador Full Stack, game dev y entusiasta del IoT. Miembro del Meta Tech Provider y Microsoft AI Cloud Partner Program. Apasionado por la robótica, el espacio y construir cosas que la gente realmente use.`,
    details: [
      { k: 'Ubicación', v: 'San Cristóbal, Juan Díaz, Panamá' },
      { k: 'Email',     v: 'dmpp1920@gmail.com' },
      { k: 'Teléfono',  v: '+507 6608-5665' },
      { k: 'GitHub',    v: '@dev-dmpp' },
      { k: 'Idiomas',   v: 'Español nativo · Inglés B2' },
    ],
    links: [
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/davidmpollardp' },
      { label: 'GitHub',   url: 'https://github.com/dev-dmpp' },
    ],
  },
  {
    id: 'wohts',
    kind: 'planet',
    name: 'WOHTS',
    subtitle: 'Planeta principal — mi marca',
    description: `Marca personal bajo la que ofrezco desarrollo freelance. WOHTS es donde convergen mis proyectos externos, tutorías de robótica y programación, y el desarrollo de Conversari — The AI OS for Business.`,
    details: [
      { k: 'Tipo',     v: 'Independiente' },
      { k: 'Periodo',  v: '2020 – Actualidad' },
      { k: 'Stack',    v: 'PHP, JS, Docker, Podman' },
      { k: 'Web',      v: 'wohts.com' },
    ],
    links: [{ label: 'Sitio web', url: 'https://wohts.com' }],
    orbitHint: 'WOHTS — orbitando',
  },
  {
    id: 'experience',
    kind: 'planet',
    name: 'Trayectoria',
    subtitle: 'Planeta rocoso — experiencia profesional',
    description: `Más de cinco años tocando código en producción. Desde el freelance hasta pasos por empresas de transformación digital.`,
    details: [
      { k: 'WOHTS',                  v: 'Full Stack — 2020 a la fecha' },
      { k: 'Graphic Service Express', v: 'Dev + Analista TX Digital — 2025' },
      { k: 'Posper Panamá',           v: 'Full Stack — 2024 a 2025' },
    ],
  },
  {
    id: 'stack',
    kind: 'moon',
    name: 'Stack',
    subtitle: 'Luna — herramientas del oficio',
    description: `Lenguajes, bases de datos y herramientas que uso en el día a día.`,
    details: [
      { k: 'Lenguajes', v: 'C#, C++, Python, Go, Java, PHP, JS' },
      { k: 'Bases de datos', v: 'SQL Server, MariaDB, MongoDB, PostgreSQL, Neon, SQLite' },
      { k: 'DevOps',    v: 'Docker, Podman, Git, Linux, k3s' },
      { k: 'Web',       v: 'HTML5, CSS3, REST APIs, Node' },
      { k: 'Hardware',  v: 'Arduino, Raspberry Pi, MicroBit, OrangePi' },
    ],
  },
  {
    id: 'certs',
    kind: 'planet',
    name: 'Certificaciones',
    subtitle: 'Gigante con lunas — formación continua',
    description: `Diez certificaciones clave que respaldan mi trabajo. Cada una es una luna que orbita este planeta.`,
    details: [
      { k: 'Michigan',        v: 'Web Design Specialization (2024)' },
      { k: 'Fundación Slim',  v: 'Técnico en Sistemas (2023)' },
      { k: 'Google',          v: 'IT Support, Python (2024)' },
      { k: 'Microsoft',       v: 'AI Classroom (2025)' },
      { k: 'Cisco',           v: 'Cybersecurity Essentials (2024)' },
      { k: 'Dell',            v: 'Project Management (2025)' },
      { k: 'Banco General',   v: 'Introducción a Kubernetes (2024)' },
      { k: 'Colorado',        v: 'C# + Unity (2023)' },
      { k: 'EF SET',          v: 'English B2 (2025)' },
    ],
  },
  {
    id: 'repos',
    kind: 'comet',
    name: 'Repos',
    subtitle: 'Cometa — código en el espacio',
    description: `Proyectos públicos. Más en camino, mientras el sistema crece.`,
    details: [
      { k: 'PolarTranslate', v: 'github.com/dev-dmpp/PolarTranslate' },
      { k: 'ZPlage',         v: 'github.com/Polar1920/ZPlage' },
    ],
    links: [
      { label: 'PolarTranslate →', url: 'https://github.com/dev-dmpp/PolarTranslate' },
      { label: 'ZPlage →',         url: 'https://github.com/Polar1920/ZPlage' },
    ],
    orbitHint: 'Cometa — aproximándose',
  },
  {
    id: 'education',
    kind: 'nebula',
    name: 'Formación',
    subtitle: 'Nebulosa — bases académicas',
    description: `Nubes de conocimiento donde se condensaron los cimientos.`,
    details: [
      { k: 'UTP', v: 'Licenciatura en Desarrollo de Software (2025)' },
      { k: 'UTP', v: 'Técnico en Ingeniería — Desarrollo de Software (2024)' },
      { k: 'CNS', v: 'Bachiller en Ciencias — énfasis Informática (2018)' },
    ],
  },
];

export function findContent(id: string): BodyContent | undefined {
  return CONTENT.find((c) => c.id === id);
}
