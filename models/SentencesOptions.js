const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const sentenceSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    unique: true,
  },
  options: {
    type: [String],
    default: []
  },

});
var sentencesOptionsSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  sentences: [sentenceSchema],
});
sentencesOptionsSchema.index(
  { heading: 1, "sentences.title": 1 },
  { unique: true }
);
sentencesOptionsSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("SentenceOption", sentencesOptionsSchema);
