const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const DynamicCategorySchema = new mongoose.Schema({
  name: {
    type: String,
  },
  slug: {
    type: String,
  },
  jobs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
  ],
});

DynamicCategorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model("DynamicCategory", DynamicCategorySchema);
