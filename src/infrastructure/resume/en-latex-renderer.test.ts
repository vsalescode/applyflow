import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { ResumeContent } from "@/domain/resume/resume-content";

import { renderEnResume } from "./en-latex-renderer";

const template = readFileSync(
  join(process.cwd(), "templates", "en", "template.tex"),
  "utf8",
);
const id = () => randomUUID();
const content: ResumeContent = {
  language: "EN",
  personalInfo: {
    fullName: "Jane Smith",
    location: "Austin, TX — USA",
    email: "jane@example.com",
    links: [],
  },
  experiences: [
    {
      factId: id(),
      company: "Research & Development",
      role: "Software Engineer",
      period: { start: "2024-02", ongoing: true },
      bullets: [{ text: "Improved APIs by 25%.", evidenceFactIds: [id()] }],
    },
  ],
  projects: [],
  skillGroups: [
    { label: "Backend", skills: [{ factId: id(), name: "Node.js" }] },
  ],
  education: [
    {
      factId: id(),
      institution: "Example University",
      qualification: "Software Engineering",
      period: { end: "2028-12", ongoing: false },
      expectedCompletion: true,
    },
  ],
  courses: [{ factId: id(), name: "Docker", status: "IN_PROGRESS" }],
  languages: [{ factId: id(), name: "English", proficiency: "Fluent" }],
};

describe("EN LaTeX renderer", () => {
  it("renders localized content while preserving the English template", () => {
    const output = renderEnResume(template, content);

    expect(output).toContain("\\usepackage[english]{babel}");
    expect(output).toContain("{\\LARGE\\textbf{Jane Smith}}");
    expect(output).toContain("Research \\& Development");
    expect(output).toContain("Feb/2024 -- Present");
    expect(output).toContain("Expected Graduation: Dec/2028");
    expect(output).toContain("In Progress");
    expect(output).not.toContain("Full Name");
    expect(output).not.toContain("Example Company");
  });

  it("removes empty sections", () => {
    const output = renderEnResume(template, {
      ...content,
      projects: [],
      education: [],
      courses: [],
      languages: [],
    });

    expect(output).not.toContain("\\section{Featured Projects}");
    expect(output).not.toContain("\\section{Education}");
    expect(output).not.toContain("\\section{Additional Courses}");
    expect(output).not.toContain("\\section{Languages}");
    expect(output).toContain("\\end{document}");
  });

  it("rejects content and templates for another language", () => {
    expect(() =>
      renderEnResume(template, { ...content, language: "PT_BR" }),
    ).toThrow("exige conteúdo EN");
    expect(() =>
      renderEnResume(template.replace("english", "brazil"), content),
    ).toThrow("Template EN inválido");
  });
});
