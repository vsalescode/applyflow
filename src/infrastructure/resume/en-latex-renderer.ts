import {
  renderResumeWithTemplate,
  type LatexRendererLabels,
} from "./pt-br-latex-renderer";

const enLabels: LatexRendererLabels = {
  language: "EN",
  babel: "english",
  documentTitle: "Resume",
  sections: [
    "Professional Experience",
    "Featured Projects",
    "Technical Skills",
    "Education",
    "Additional Courses",
    "Languages",
  ],
  current: "Present",
  expectedCompletion: "Expected Graduation: ",
  completed: "Completed",
  inProgress: "In Progress",
  link: "Link",
  months: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
};

export function renderEnResume(template: string, value: unknown) {
  return renderResumeWithTemplate(template, value, enLabels);
}
