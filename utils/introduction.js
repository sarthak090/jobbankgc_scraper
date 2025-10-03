const db = require("../models");

async function main() {
  try {
    const newIntroduction = await db.IntroductionSentences.create({
      title: "Remote job",
      wordsToReplace: [""],
      options: sentences6,
      sentenceOrder: "sentence_6",
    });
    console.log(newIntroduction);
  } catch (err) {
    console.log(err);
  }
}

async function deleteMany() {
  db.IntroductionSentences.deleteMany({})
    .then(() => {
      console.log("All records deleted successfully.");
    })
    .catch((err) => {
      console.error("Error deleting records:", err);
    });
}
// deleteMany();
// main();
