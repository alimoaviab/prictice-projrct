const path = require("node:path");
const { seedSyllabusFromFile } = require("./lib/seed-syllabus");

module.exports = function seedAfaq(options = {}) {
  return seedSyllabusFromFile(path.join(__dirname, "..", "..", "data", "syllabus", "afaq.json"), options);
};

if (require.main === module) {
  module.exports();
}
