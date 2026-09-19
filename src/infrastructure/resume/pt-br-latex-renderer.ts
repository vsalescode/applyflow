import {
  parseResumeContent,
  type ResumeContent,
} from "@/domain/resume/resume-content";

const sectionOrder = [
  "Experiência Profissional",
  "Projetos em Destaque",
  "Competências Técnicas",
  "Formação Acadêmica",
  "Cursos Complementares",
  "Idiomas",
] as const;

export function renderPtBrResume(template: string, value: unknown) {
  const content = parseResumeContent(value);
  if (content.language !== "PT_BR")
    throw new Error("O renderer PT-BR exige conteúdo PT_BR.");
  assertTemplateStructure(template);

  let document = template
    .replace(
      /pdftitle=\{[^}]*\}/,
      `pdftitle={${escapeLatex(`Currículo ${content.personalInfo.fullName}`)}}`,
    )
    .replace(
      /pdfauthor=\{[^}]*\}/,
      `pdfauthor={${escapeLatex(content.personalInfo.fullName)}}`,
    )
    .replace(
      /\\begin\{center\}[\s\S]*?\\end\{center\}/,
      renderHeader(content.personalInfo),
    );
  const bodies = [
    renderExperiences(content.experiences),
    renderProjects(content.projects),
    renderSkillGroups(content.skillGroups),
    renderEducation(content.education),
    renderCourses(content.courses),
    renderLanguages(content.languages),
  ];
  for (let index = 0; index < sectionOrder.length; index += 1)
    document = replaceSection(
      document,
      sectionOrder[index],
      sectionOrder[index + 1],
      bodies[index],
    );
  return document;
}

export function escapeLatex(value: string) {
  const replacements: Record<string, string> = {
    "\\": "\\textbackslash{}",
    "{": "\\{",
    "}": "\\}",
    $: "\\$",
    "&": "\\&",
    "#": "\\#",
    _: "\\_",
    "%": "\\%",
    "~": "\\textasciitilde{}",
    "^": "\\textasciicircum{}",
  };
  return [...value]
    .map((character) => replacements[character] ?? character)
    .join("");
}

function assertTemplateStructure(template: string) {
  if (!template.includes("\\usepackage[brazil]{babel}"))
    throw new Error("Template PT-BR inválido: configuração de idioma ausente.");
  if (
    !template.includes("\\begin{center}") ||
    !template.includes("\\end{document}")
  )
    throw new Error("Template PT-BR inválido: estrutura principal ausente.");
  for (const section of sectionOrder)
    if (!template.includes(`\\section{${section}}`))
      throw new Error(`Template PT-BR inválido: seção ${section} ausente.`);
}

function renderHeader(info: ResumeContent["personalInfo"]) {
  const contacts = [
    info.email
      ? `\\href{mailto:${escapeLatex(info.email)}}{${escapeLatex(info.email)}}`
      : null,
    ...info.links.map(
      (link) => `\\href{${escapeLatex(link.url)}}{${escapeLatex(link.label)}}`,
    ),
  ].filter(Boolean);
  const locationAndPhone = [info.location, info.phone]
    .filter(Boolean)
    .map((item) => escapeLatex(item!))
    .join("\n\\quad\\textbullet\\quad\n");
  return [
    "\\begin{center}",
    "",
    `{\\LARGE\\textbf{${escapeLatex(info.fullName)}}}`,
    locationAndPhone ? `\n\\vspace{-0.15cm}\n\n${locationAndPhone}` : "",
    contacts.length
      ? `\n\\vspace{0.01cm}\n\n${contacts.join("\n\\quad\\textbullet\\quad\n")}`
      : "",
    "",
    "\\end{center}",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

function renderExperiences(items: ResumeContent["experiences"]) {
  return items
    .map((item) =>
      [
        `\\textbf{${escapeLatex(item.company)}}${right(item.location)}`,
        "",
        `\\textit{${escapeLatex(item.role)}}${right(formatPeriod(item.period))}`,
        "",
        renderBullets(item.bullets.map((bullet) => bullet.text)),
      ].join("\n"),
    )
    .join("\n\n\\vspace{0.01cm}\n\n");
}

function renderProjects(items: ResumeContent["projects"]) {
  return items
    .map((item) => {
      const link = item.url
        ? `\\href{${escapeLatex(item.url)}}{${escapeLatex(item.urlLabel ?? "Link")}}`
        : undefined;
      return [
        `\\textbf{${escapeLatex(item.name)}}${right(link)}`,
        item.technologies.length
          ? `\n\\textit{${item.technologies.map(escapeLatex).join(" | ")}}`
          : "",
        "",
        renderBullets(item.bullets.map((bullet) => bullet.text)),
      ].join("\n");
    })
    .join("\n\n\\vspace{0.01cm}\n\n");
}

function renderSkillGroups(groups: ResumeContent["skillGroups"]) {
  if (!groups.length) return "";
  return renderBullets(
    groups.map(
      (group) =>
        `\\textbf{${escapeLatex(group.label)}:} ${group.skills
          .map((skill) => escapeLatex(skill.name))
          .join(", ")}.`,
    ),
    false,
  );
}

function renderEducation(items: ResumeContent["education"]) {
  return items
    .map((item) => {
      const period = `${item.expectedCompletion ? "Conclusão prevista: " : ""}${formatPeriod(item.period)}`;
      return [
        `\\textbf{${escapeLatex(item.institution)}}${right(item.location)}`,
        "",
        `\\textit{${escapeLatex(item.qualification)}}${right(`\\textit{${escapeLatex(period)}}`)}`,
      ].join("\n");
    })
    .join("\n\n\\vspace{0.01cm}\n\n");
}

function renderCourses(items: ResumeContent["courses"]) {
  if (!items.length) return "";
  return renderBullets(
    items.map((item) => {
      const title = [item.name, item.provider].filter(Boolean).join(" -- ");
      const status = item.status === "COMPLETED" ? "Concluído" : "Em andamento";
      return `\\textbf{${escapeLatex(title)}}${right(status)}`;
    }),
    false,
  );
}

function renderLanguages(items: ResumeContent["languages"]) {
  if (!items.length) return "";
  return renderBullets(
    items.map(
      (item) =>
        `\\textbf{${escapeLatex(item.name)}:} ${escapeLatex(item.proficiency)}`,
    ),
    false,
  );
}

function renderBullets(items: string[], escape = true) {
  return [
    "\\begin{itemize}",
    "",
    ...items.map((item) => `    \\item ${escape ? escapeLatex(item) : item}`),
    "",
    "\\end{itemize}",
  ].join("\n");
}

function replaceSection(
  template: string,
  title: string,
  nextTitle: string | undefined,
  body: string,
) {
  const start = `\\section{${title}}`;
  const end = nextTitle ? `\\section{${nextTitle}}` : "\\end{document}";
  const startIndex = template.indexOf(start);
  const endIndex = template.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0)
    throw new Error(`Seção ${title} não encontrada.`);
  const replacement = body ? `${start}\n\n${body}\n\n` : "";
  return `${template.slice(0, startIndex)}${replacement}${template.slice(endIndex)}`;
}

function right(value: string | undefined) {
  return value ? `\n\\hfill\n${escapeUnlessLatex(value)}` : "";
}

function escapeUnlessLatex(value: string) {
  return value.startsWith("\\") ? value : escapeLatex(value);
}

function formatPeriod(period: ResumeContent["experiences"][number]["period"]) {
  const start = period.start ? formatMonth(period.start) : undefined;
  const end = period.ongoing
    ? "Atual"
    : period.end
      ? formatMonth(period.end)
      : undefined;
  return [start, end].filter(Boolean).join(" -- ");
}

function formatMonth(value: string) {
  const [year, month] = value.split("-");
  const names = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return `${names[Number(month) - 1]}/${year}`;
}
