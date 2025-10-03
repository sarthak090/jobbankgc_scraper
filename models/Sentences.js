const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

var sentencesSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true,
    unique: true,
  },
  sentences: {
    type: [String],
    required: true,
  },
});
sentencesSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Sentence", sentencesSchema);
