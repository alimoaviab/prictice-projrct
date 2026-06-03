const fs = require("node:fs");
const path = require("node:path");

function flattenSyllabus(syllabus) {
  const rows = [];
  for (const cls of syllabus.classes || []) {
    for (const subject of cls.subjects || []) {
      for (const unit of subject.chapters || []) {
        for (const chapter of unit.chapters || []) {
          rows.push({
            syllabus: syllabus.id,
            syllabusName: syllabus.name,
            class: cls.name,
            subject: subject.name,
            unit: unit.title,
            chapter: chapter.title,
            chapterCode: chapter.code,
            metadata: { class: cls.metadata, subject: subject.metadata, unit: unit.metadata, chapter },
          });
        }
      }
    }
  }
  return rows;
}

function seedSyllabusFromFile(filePath, options = {}) {
  const syllabus = JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8"));
  const rows = flattenSyllabus(syllabus);
  if (options.writeLog !== false) {
    console.log(JSON.stringify({ syllabus: syllabus.id, classes: syllabus.classes.length, records: rows.length }, null, 2));
  }
  return rows;
}

module.exports = { flattenSyllabus, seedSyllabusFromFile };
