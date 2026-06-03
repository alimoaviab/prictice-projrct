import type { BaseChapter, BaseUnit } from "@/components/syllabus/ChapterSelector";
import { QUESTION_TYPES } from "../question-types";

export interface CurriculumSubject {
  id: string;
  name: string;
  metadata: {
    sourceSyllabus: string;
    chapterGroups: number;
    chapterCount: number;
    [key: string]: unknown;
  };
  chapters: BaseUnit[];
}

export interface CurriculumClass {
  id: string;
  name: string;
  metadata: {
    sourceSyllabus: string;
    subjects: number;
    chapterCount: number;
    [key: string]: unknown;
  };
  subjects: CurriculumSubject[];
}

export interface SyllabusConfig {
  id: "ptb" | "afaq" | "oxford" | "gohar";
  name: string;
  metadata: {
    sourceId: string;
    source: string;
    schemaVersion: number;
    [key: string]: unknown;
  };
  classes: CurriculumClass[];
}

export type SyllabusId = SyllabusConfig["id"];

export interface SelectOption {
  id: string;
  label: string;
}

const SYLLABUS_MANIFEST: Array<Pick<SyllabusConfig, "id" | "name" | "metadata">> = [
  {
    id: "ptb",
    name: "PTB",
    metadata: { sourceId: "ptb", source: "Punjab Textbook Board", schemaVersion: 1 },
  },
  {
    id: "afaq",
    name: "AFAQ",
    metadata: { sourceId: "afaq", source: "AFAQ SNC", schemaVersion: 1 },
  },
  {
    id: "oxford",
    name: "OXFORD",
    metadata: { sourceId: "oxford", source: "Oxford SNC", schemaVersion: 1 },
  },
  {
    id: "gohar",
    name: "GOHAR",
    metadata: { sourceId: "gohar", source: "Gohar SNC", schemaVersion: 1 },
  },
];

export const SYLLABUS_CONFIGS = SYLLABUS_MANIFEST.map((syllabus) => ({
  ...syllabus,
  classes: [],
})) as SyllabusConfig[];

const syllabusAliases: Record<string, SyllabusId> = {
  ptb: "ptb",
  "punjab-textbook-board": "ptb",
  afaq: "afaq",
  "afaq-snc": "afaq",
  oxford: "oxford",
  "oxford-snc": "oxford",
  gohar: "gohar",
  "gohar-snc": "gohar",
};

const normalizeText = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const syllabusConfigCache = new Map<SyllabusId, Promise<SyllabusConfig>>();

export function normalizeSyllabusId(value?: string | null): SyllabusId {
  const key = String(value || "ptb").trim().toLowerCase();
  return syllabusAliases[key] || "ptb";
}

export function getSyllabusById(value?: string | null): SyllabusConfig {
  const id = normalizeSyllabusId(value);
  return SYLLABUS_CONFIGS.find((syllabus) => syllabus.id === id) || SYLLABUS_CONFIGS[0];
}

export async function loadSyllabusConfig(value?: string | null): Promise<SyllabusConfig> {
  const id = normalizeSyllabusId(value);
  const cached = syllabusConfigCache.get(id);
  if (cached) return cached;

  const request = fetch(`/data/syllabus/${id}.json`, { headers: { Accept: "application/json" } }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Unable to load ${id.toUpperCase()} syllabus configuration (${response.status})`);
    }
    return response.json() as Promise<SyllabusConfig>;
  });
  syllabusConfigCache.set(id, request);
  return request;
}

export async function loadSyllabusConfigs(): Promise<SyllabusConfig[]> {
  return Promise.all(SYLLABUS_CONFIGS.map((syllabus) => loadSyllabusConfig(syllabus.id)));
}

export function getSyllabusOptions(): SelectOption[] {
  return SYLLABUS_MANIFEST.map((syllabus) => ({
    id: syllabus.id,
    label: syllabus.name,
  }));
}

export function getClassesFromConfig(syllabus?: SyllabusConfig | null): CurriculumClass[] {
  return syllabus?.classes || [];
}

export function getSubjectsFromConfig(syllabus: SyllabusConfig | null | undefined, className: string): CurriculumSubject[] {
  const target = normalizeText(className);
  const cls = getClassesFromConfig(syllabus).find((item) => normalizeText(item.name) === target || item.id === target);
  return cls?.subjects || [];
}

export function getSubjectFromConfig(
  syllabus: SyllabusConfig | null | undefined,
  className: string,
  subjectName: string,
): CurriculumSubject | undefined {
  const target = normalizeText(subjectName);
  return getSubjectsFromConfig(syllabus, className).find(
    (subject) => normalizeText(subject.name) === target || subject.id === target,
  );
}

export function getChapterUnitsFromConfig(
  syllabus: SyllabusConfig | null | undefined,
  className: string,
  subjectName: string,
): BaseUnit[] {
  return getSubjectFromConfig(syllabus, className, subjectName)?.chapters || [];
}

export function getAllChaptersFromConfig(
  syllabus: SyllabusConfig | null | undefined,
  className: string,
  subjectName: string,
): BaseChapter[] {
  return getChapterUnitsFromConfig(syllabus, className, subjectName).flatMap((unit) => unit.chapters);
}

export function getClassesForSyllabus(syllabusId?: string | null): CurriculumClass[] {
  void syllabusId;
  return [];
}

export function getSubjectsForClass(syllabusId: string | null | undefined, className: string): CurriculumSubject[] {
  void syllabusId;
  void className;
  return [];
}

export function getSubjectConfig(
  syllabusId: string | null | undefined,
  className: string,
  subjectName: string,
): CurriculumSubject | undefined {
  void syllabusId;
  void className;
  void subjectName;
  return undefined;
}

export function getChapterUnitsForSubject(
  syllabusId: string | null | undefined,
  className: string,
  subjectName: string,
): BaseUnit[] {
  void syllabusId;
  void className;
  void subjectName;
  return [];
}

export function getAllChaptersForSubject(
  syllabusId: string | null | undefined,
  className: string,
  subjectName: string,
): BaseChapter[] {
  void syllabusId;
  void className;
  void subjectName;
  return [];
}

export function getSyllabusData(
  syllabusId: string,
  className: string,
  subjectName: string,
): BaseUnit[] | null {
  void syllabusId;
  void className;
  void subjectName;
  return null;
}

export function hasSyllabusData(syllabusId: string, className: string, subjectName: string): boolean {
  void syllabusId;
  void className;
  void subjectName;
  return false;
}

export async function buildDependencyMap() {
  const configs = await loadSyllabusConfigs();
  return configs.map((syllabus) => ({
    syllabus: syllabus.name,
    classes: syllabus.classes.map((cls) => ({
      class: cls.name,
      subjects: cls.subjects.map((subject) => ({
        subject: subject.name,
        chapterGroups: subject.chapters.length,
        chapters: subject.chapters.flatMap((unit) => unit.chapters).length,
        questionTypes: QUESTION_TYPES.length,
      })),
    })),
  }));
}
