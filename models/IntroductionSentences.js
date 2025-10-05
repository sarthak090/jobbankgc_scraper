const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

var introductionSentencesSchema = new mongoose.Schema({
  title: {
    type: String,
    // unique: true,
    // required: true,
  },
  // wordsToReplace: {
  //   type: [String],

  //   required: true,
  // },
  options: { type: [String], unique: true, required: true },
  sentenceOrder: { type: String, unique: true, required: true },
});
introductionSentencesSchema.plugin(mongoosePaginate);

module.exports = mongoose.model(
  "IntroductionSentences",
  introductionSentencesSchema
);
