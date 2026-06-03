const path = require("node:path");
const { seedSyllabusFromFile } = require("./lib/seed-syllabus");

module.exports = function seedOxford(options = {}) {
  return seedSyllabusFromFile(path.join(__dirname, "..", "..", "data", "syllabus", "oxford.json"), options);
};

if (require.main === module) {
  module.exports();
}
