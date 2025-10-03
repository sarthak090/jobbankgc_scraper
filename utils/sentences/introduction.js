const db = require("../../models/index");

async function updateIntroductionOptions({ title, options }) {
  return new Promise(async (resolve, reject) => {
    if (!title || !options) {
      return reject("Provide all the data");
    }
    const sentence = await db.IntroductionSentences.findOne({ title });
    if (sentence === null) {
      return reject("No Sentence Found");
    }

    sentence.options = options;
    try {
      await sentence.save();
      resolve("Sentence is Updated Successfully");
    } catch (err) {
      reject(err);
    }
    return sentence;
  });
}
module.exports = {
  updateIntroductionOptions,
};
