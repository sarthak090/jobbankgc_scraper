const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const sentenceSchema = new mongoose.Schema({
  title: {
    type: String,

    unique: true,
  },
  options: [String],
});
var sentencesOptionsSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
    unique: true,
  },
  sentences: [sentenceSchema],
});
sentencesOptionsSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("SentenceOption", sentencesOptionsSchema);
