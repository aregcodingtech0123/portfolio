export type CertificateItem = {
  name: string;
  issuer: string;
  /** Optional; omitted when not shown on the original credential. */
  date?: string;
};

export const educationCertificates: CertificateItem[] = [
  {
    name: "Certificate of Cloud Computing with AWS",
    issuer: "BTK Akademi",
    date: "March 2026",
  },
  {
    name: "Developing AI Agents using Platforms",
    issuer: "BTK Akademi",
    date: "March 2026",
  },
  {
    name: "Talent Coders Code Genius Certificate",
    issuer: "Talentcoders",
    date: "February 2026",
  },
  {
    name: "Introduction to Generative AI",
    issuer: "BTK Akademi",
    date: "February 2026",
  },
  {
    name: "Advanced Cyber Security in Technologies",
    issuer: "HAVELSAN",
    date: "February 2024",
  },
  {
    name: "AI Literacy",
    issuer: "Ankara Science University",
    date: "May 2024",
  },
  {
    name: "3D Design and Printing",
    issuer: "KA3D Arge Tasarım",
    date: "October 2022",
  },
  {
    name: "Java Lab Assistantship",
    issuer: "Ankara Science University",
  },
  {
    name: "Internship Completion Certificate",
    issuer: "RE/MAX Wise",
    date: "October 2025",
  },
  {
    name: "Blockchain Training",
    issuer: "1. Vision & Efficiency Summit",
    date: "May 2023",
  },
  {
    name: "Ethical Hacking Training",
    issuer: "1. Vision & Efficiency Summit",
    date: "May 2023",
  },
  {
    name: "Game & AI Training",
    issuer: "VES 2024",
    date: "May 2024",
  },
  {
    name: "Penetration Testing",
    issuer: "CSCON'22",
    date: "March 2022",
  },
  {
    name: "SEM Education Certificate",
    issuer: "FSMVU / Altin Kariyer",
    date: "July 2023",
  },
];

export const participationCertificates: CertificateItem[] = [
  {
    name: "Ankara Start-Up Summit",
    issuer: "Bilkent University",
    date: "November 2025",
  },
  {
    name: "Career Summit'25",
    issuer: "BTK Akademi",
    date: "December 2025",
  },
  {
    name: "Ankara Development Summit",
    issuer:
      "Senda Etkinlik (featuring İlber Ortaylı, Celal Şengör, Naci Görür)",
    date: "May 2025",
  },
  {
    name: "Cloud Computing & AI Summit 2024",
    issuer: "BTK Akademi",
    date: "December 2024",
  },
  {
    name: "Cloud Computing & AI Summit 2023",
    issuer: "BTK Akademi",
    date: "October 2023",
  },
  {
    name: "Science Communication Volunteering Program",
    issuer: "T3 Foundation",
    date: "2024",
  },
  {
    name: "TÜBİTAK-4007 Science Wind Workshop Mentorship",
    issuer: "TÜBİTAK",
    date: "November 2024",
  },
];

export function formatCertificateLine(item: CertificateItem): string {
  if (item.date) {
    return `${item.name} - ${item.issuer} (${item.date})`;
  }
  return `${item.name} - ${item.issuer}`;
}
