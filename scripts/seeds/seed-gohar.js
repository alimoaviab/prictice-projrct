const path = require("node:path");
const { seedSyllabusFromFile } = require("./lib/seed-syllabus");

module.exports = function seedGohar(options = {}) {
  return seedSyllabusFromFile(path.join(__dirname, "..", "..", "data", "syllabus", "gohar.json"), options);
};

if (require.main === module) {
  module.exports();
}
