const jobDescription = document.querySelector("#jobDescription");
const roleInput = document.querySelector("#role");
const analyzeBtn = document.querySelector("#analyzeBtn");
const downloadBtn = document.querySelector("#downloadBtn");
const resumePhoto = document.querySelector("#resumePhoto");
const photoPreview = document.querySelector("#photoPreview");
const photoNote = document.querySelector("#photoNote");
const ocrProgress = document.querySelector("#ocrProgress");
const ocrStatus = document.querySelector("#ocrStatus");

const scoreRing = document.querySelector(".score-ring");
const scoreValue = document.querySelector("#scoreValue");
const scoreLabel = document.querySelector("#scoreLabel");
const skillScore = document.querySelector("#skillScore");
const structureScore = document.querySelector("#structureScore");
const atsScore = document.querySelector("#atsScore");
const reportTitle = document.querySelector("#reportTitle");
const matchedSkills = document.querySelector("#matchedSkills");
const missingSkills = document.querySelector("#missingSkills");
const matchedCount = document.querySelector("#matchedCount");
const missingCount = document.querySelector("#missingCount");
const suggestions = document.querySelector("#suggestions");
const suggestionCount = document.querySelector("#suggestionCount");
const sections = document.querySelector("#sections");
const sectionCount = document.querySelector("#sectionCount");
const keywords = document.querySelector("#keywords");
const keywordCount = document.querySelector("#keywordCount");

const skillBank = [
  "html",
  "css",
  "javascript",
  "typescript",
  "react",
  "angular",
  "vue",
  "node",
  "express",
  "python",
  "java",
  "c++",
  "sql",
  "mongodb",
  "mysql",
  "postgresql",
  "git",
  "github",
  "api",
  "rest",
  "graphql",
  "testing",
  "jest",
  "selenium",
  "responsive design",
  "accessibility",
  "performance",
  "aws",
  "azure",
  "docker",
  "kubernetes",
  "machine learning",
  "data analysis",
  "excel",
  "power bi",
  "tableau",
  "communication",
  "teamwork",
  "leadership",
  "problem solving",
  "agile",
  "scrum"
];

const sectionChecks = [
  { label: "Contact", headings: ["contact", "contact details", "personal details"] },
  { label: "Summary", headings: ["summary", "professional summary", "career objective", "objective", "profile"] },
  { label: "Skills", headings: ["skills", "technical skills", "key skills", "technologies"] },
  { label: "Projects", headings: ["projects", "academic projects", "personal projects", "project work"] },
  { label: "Experience", headings: ["experience", "work experience", "professional experience", "internship", "internships"] },
  { label: "Education", headings: ["education", "academic background", "qualification", "qualifications"] },
  { label: "Achievements", headings: ["achievements", "certifications", "awards", "accomplishments"] }
];

let latestReport = null;
let attachedPhotoName = "";
let attachedPhotoUrl = "";
let attachedPhotoFile = null;

function normalize(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function containsTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9+])${escaped}([^a-z0-9+]|$)`, "i").test(text);
}

function extractRoleSkills(jobText) {
  const normalizedJob = normalize(jobText);
  const found = skillBank.filter((skill) => containsTerm(normalizedJob, skill));
  return found.length ? found : skillBank.slice(0, 12);
}

function detectSections(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/[:\-|\u2022]/g, " ").replace(/\s+/g, " ").trim().toLowerCase())
    .filter(Boolean);
  const normalizedResume = normalize(text);

  return sectionChecks.map((section) => {
    let present = lines.some((line) =>
      section.headings.some((heading) => line === heading)
    );

    if (section.label === "Contact") {
      present =
        present ||
        /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text) ||
        /linkedin\.com|github\.com/i.test(text) ||
        /\b(\+?\d[\d\s-]{8,}\d)\b/.test(text);
    }

    if (section.label === "Education") {
      present = present || /\b(b\.?tech|m\.?tech|b\.?e|m\.?e|bca|mca|bsc|msc|degree|university|college)\b/i.test(text);
    }

    if (section.label === "Skills") {
      const skillHits = skillBank.filter((skill) => containsTerm(normalizedResume, skill)).length;
      present = present || skillHits >= 4;
    }

    return {
      label: section.label,
      present
    };
  });
}

function getKeywordDensity(text, roleSkills) {
  const normalizedResume = normalize(text);
  return roleSkills
    .map((skill) => {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matches = normalizedResume.match(new RegExp(escaped, "gi"));
      return { skill, count: matches ? matches.length : 0 };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function calculateAtsScore(text) {
  let score = 35;
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)) score += 15;
  if (/\b(\+?\d[\d\s-]{8,}\d)\b/.test(text)) score += 12;
  if (/linkedin\.com/i.test(text)) score += 10;
  if (/github\.com/i.test(text)) score += 8;
  if (!/[|]{3,}|_{4,}|={4,}/.test(text)) score += 10;
  if (text.split(/\s+/).filter(Boolean).length >= 120) score += 10;
  return Math.min(score, 100);
}

function countResumeSignals(text) {
  const signals = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(\+?\d[\d\s-]{8,}\d)\b/,
    /linkedin\.com|github\.com/i,
    /\b(skills|technical skills|technologies)\b/i,
    /\b(education|b\.?tech|m\.?tech|degree|college|university)\b/i,
    /\b(projects|academic projects|personal projects)\b/i,
    /\b(experience|internship|work experience)\b/i,
    /\b(summary|objective|profile)\b/i
  ];

  return signals.filter((pattern) => pattern.test(text)).length;
}

function validateResumeText(text, confidence) {
  const words = text.split(/\s+/).filter((word) => /[a-z0-9]/i.test(word));
  const resumeSignals = countResumeSignals(text);
  const sectionHits = detectSections(text).filter((section) => section.present).length;

  if (confidence && confidence < 35) {
    return {
      valid: false,
      reason: "The uploaded image does not contain clear readable resume text. Please upload a sharper resume photo."
    };
  }

  if (words.length < 45) {
    return {
      valid: false,
      reason: "This image does not look like a resume. Please upload a full resume page with readable text."
    };
  }

  if (resumeSignals < 2 && sectionHits < 2) {
    return {
      valid: false,
      reason: "The image was read, but it is missing normal resume details like skills, education, contact, projects, or experience."
    };
  }

  return { valid: true };
}

function resetReport(message) {
  latestReport = null;
  downloadBtn.disabled = true;
  scoreRing.style.setProperty("--score", 0);
  scoreValue.textContent = "0";
  scoreLabel.textContent = "Not a resume";
  reportTitle.textContent = "Analysis Report";
  skillScore.textContent = "0%";
  structureScore.textContent = "0%";
  atsScore.textContent = "0%";
  renderTags(matchedSkills, [], "tag", "Upload a valid resume photo to view matches.");
  renderTags(missingSkills, [], "tag missing", "No missing skills to show yet.");
  matchedCount.textContent = "0 found";
  missingCount.textContent = "0 missing";
  suggestions.innerHTML = `<li>${escapeHtml(message)}</li>`;
  suggestionCount.textContent = "1 tip";
  sections.innerHTML = "";
  sectionCount.textContent = "0 sections";
  keywords.innerHTML = "";
  keywordCount.textContent = "0 keywords";
}

function makeSuggestions(report) {
  const tips = [];

  if (report.missing.length) {
    tips.push(`Add proof of these role keywords where truthful: ${report.missing.slice(0, 6).join(", ")}.`);
  }

  const missingSections = report.sections.filter((section) => !section.present).map((section) => section.label);
  if (missingSections.length) {
    tips.push(`Include clear ${missingSections.slice(0, 3).join(", ")} section headings for better scanning.`);
  }

  if (report.wordCount < 120) {
    tips.push("Expand project and experience bullets with problem, action, tool, and result.");
  }

  if (!/\d+%|\b\d+\+|\b\d+\s?(users|projects|pages|seconds|hours|members)\b/i.test(report.resume)) {
    tips.push("Add measurable impact such as percentages, counts, speed improvements, or team size.");
  }

  if (!/\b(built|created|developed|designed|improved|optimized|led|automated|implemented)\b/i.test(report.resume)) {
    tips.push("Start bullets with strong action verbs like built, improved, optimized, or implemented.");
  }

  if (report.ats < 75) {
    tips.push("Keep contact links visible and avoid heavy tables, repeated symbols, or image-only resume content.");
  }

  return tips.length ? tips : ["Resume is well aligned. Fine tune bullet results and keep keywords natural."];
}

async function extractTextFromPhoto() {
  if (!attachedPhotoFile) {
    photoNote.textContent = "Please upload a resume photo first.";
    return {
      text: "",
      confidence: 0
    };
  }

  if (!window.Tesseract) {
    ocrStatus.textContent = "OCR library could not load. Check internet connection and refresh.";
    return {
      text: "",
      confidence: 0
    };
  }

  analyzeBtn.disabled = true;
  analyzeBtn.textContent = "Reading Photo...";
  ocrProgress.style.width = "0%";
  ocrStatus.textContent = "Starting OCR...";

  try {
    const result = await Tesseract.recognize(attachedPhotoFile, "eng", {
      logger: (message) => {
        if (message.status) {
          ocrStatus.textContent = titleCase(message.status);
        }
        if (typeof message.progress === "number") {
          ocrProgress.style.width = `${Math.round(message.progress * 100)}%`;
        }
      }
    });

    const extracted = result.data.text.trim();
    const confidence = Math.round(result.data.confidence || 0);
    ocrStatus.textContent = extracted
      ? `Text extracted successfully (${confidence}% confidence)`
      : "No readable text found";
    ocrProgress.style.width = "100%";
    return {
      text: extracted,
      confidence
    };
  } catch (error) {
    ocrStatus.textContent = "Could not read this image. Try a clearer resume photo.";
    return {
      text: "",
      confidence: 0
    };
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Analyze Photo";
  }
}

async function analyzeResume() {
  const ocrResult = await extractTextFromPhoto();
  const resume = ocrResult.text;
  const job = jobDescription.value.trim();
  const role = roleInput.value.trim() || "Selected Role";

  if (!resume) {
    resetReport("No readable resume text was found. Upload a clearer resume photo.");
    return;
  }

  const validation = validateResumeText(resume, ocrResult.confidence);
  if (!validation.valid) {
    ocrStatus.textContent = validation.reason;
    resetReport(validation.reason);
    return;
  }

  const roleSkills = extractRoleSkills(job);
  const normalizedResume = normalize(resume);
  const matched = roleSkills.filter((skill) => containsTerm(normalizedResume, skill));
  const missing = roleSkills.filter((skill) => !matched.includes(skill));
  const detectedSections = detectSections(resume);
  const presentSections = detectedSections.filter((section) => section.present).length;
  const wordCount = resume.split(/\s+/).filter(Boolean).length;

  const skillPercent = Math.round((matched.length / roleSkills.length) * 100);
  const structurePercent = Math.round((presentSections / detectedSections.length) * 100);
  const atsPercent = calculateAtsScore(resume);
  const lengthBonus = wordCount >= 180 ? 5 : wordCount >= 100 ? 2 : 0;
  const overall = Math.min(
    100,
    Math.round(skillPercent * 0.48 + structurePercent * 0.27 + atsPercent * 0.2 + lengthBonus)
  );

  latestReport = {
    role,
    resume,
    matched,
    missing,
    sections: detectedSections,
    keywords: getKeywordDensity(resume, roleSkills),
    skillPercent,
    structurePercent,
    ats: atsPercent,
    overall,
    wordCount,
    photoName: attachedPhotoName,
    extractedText: resume,
    ocrConfidence: ocrResult.confidence
  };
  latestReport.suggestions = makeSuggestions(latestReport);

  renderReport(latestReport);
}

function renderReport(report) {
  downloadBtn.disabled = false;
  scoreRing.style.setProperty("--score", report.overall);
  scoreValue.textContent = report.overall;
  scoreLabel.textContent = getScoreLabel(report.overall);
  reportTitle.textContent = `${report.role} Analysis`;
  skillScore.textContent = `${report.skillPercent}%`;
  structureScore.textContent = `${report.structurePercent}%`;
  atsScore.textContent = `${report.ats}%`;

  renderTags(matchedSkills, report.matched, "tag", "No matching role skills found yet.");
  renderTags(missingSkills, report.missing, "tag missing", "No major skill gaps detected.");
  matchedCount.textContent = `${report.matched.length} found`;
  missingCount.textContent = `${report.missing.length} missing`;

  suggestions.innerHTML = report.suggestions.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("");
  suggestionCount.textContent = `${report.suggestions.length} tips`;

  sections.innerHTML = report.sections
    .map(
      (section) =>
        `<div><strong>${section.label}</strong><span class="${section.present ? "status-yes" : "status-no"}">${section.present ? "Present" : "Missing"}</span></div>`
    )
    .join("");
  sectionCount.textContent = `${report.sections.filter((section) => section.present).length} sections`;

  keywords.innerHTML = report.keywords.length
    ? report.keywords
        .map((item) => `<div><strong>${escapeHtml(titleCase(item.skill))}</strong><span>${item.count}</span></div>`)
        .join("")
    : `<div><strong>No repeated role keywords</strong><span>0</span></div>`;
  keywordCount.textContent = `${report.keywords.length} keywords`;
}

function renderTags(target, items, className, emptyText) {
  target.classList.toggle("muted-state", items.length === 0);
  target.innerHTML = items.length
    ? items.map((item) => `<span class="${className}">${escapeHtml(titleCase(item))}</span>`).join("")
    : emptyText;
}

function getScoreLabel(score) {
  if (score >= 85) return "Excellent fit";
  if (score >= 70) return "Strong match";
  if (score >= 50) return "Needs improvement";
  return "Low alignment";
}

function titleCase(value) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function downloadReport() {
  if (!latestReport) {
    ocrStatus.textContent = "Analyze a valid resume photo before downloading the report.";
    downloadBtn.disabled = true;
    return;
  }

  const lines = [
    "AI Resume Analyzer Report",
    `Role: ${latestReport.role}`,
    `Overall Match: ${latestReport.overall}%`,
    `Skills Match: ${latestReport.skillPercent}%`,
    `Resume Quality: ${latestReport.structurePercent}%`,
    `ATS Readiness: ${latestReport.ats}%`,
    `Attached Resume Photo: ${latestReport.photoName || "None"}`,
    `OCR Confidence: ${latestReport.ocrConfidence || 0}%`,
    "",
    `Matched Skills: ${latestReport.matched.join(", ") || "None"}`,
    `Missing Skills: ${latestReport.missing.join(", ") || "None"}`,
    "",
    "Extracted Resume Text:",
    latestReport.extractedText || "None",
    "",
    "Suggestions:",
    ...latestReport.suggestions.map((tip, index) => `${index + 1}. ${tip}`)
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "resume-analysis-report.txt";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  ocrStatus.textContent = "Report download started.";
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

resumePhoto.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    photoNote.textContent = "Please select a valid resume image file.";
    resumePhoto.value = "";
    return;
  }

  if (attachedPhotoUrl) {
    URL.revokeObjectURL(attachedPhotoUrl);
  }

  attachedPhotoName = file.name;
  attachedPhotoFile = file;
  attachedPhotoUrl = URL.createObjectURL(file);
  latestReport = null;
  downloadBtn.disabled = true;
  photoPreview.classList.remove("empty");
  photoPreview.innerHTML = `<img src="${attachedPhotoUrl}" alt="Uploaded resume photo preview" />`;
  photoNote.textContent = `${file.name} added. Click Analyze Photo to extract and score it.`;
  ocrProgress.style.width = "0%";
  ocrStatus.textContent = "Photo ready for OCR";
});

analyzeBtn.addEventListener("click", analyzeResume);
downloadBtn.addEventListener("click", downloadReport);
