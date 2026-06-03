const path = require("node:path");
const { seedSyllabusFromFile } = require("./lib/seed-syllabus");

module.exports = function seedPtb(options = {}) {
  return seedSyllabusFromFile(path.join(__dirname, "..", "..", "data", "syllabus", "ptb.json"), options);
};

if (require.main === module) {
  module.exports();
}
