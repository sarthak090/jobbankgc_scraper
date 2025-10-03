const mongoose = require("mongoose");
const SubCategorySchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
  },
  name: {
    type: String,
  },
  slug: {
    type: String,
  },
});

module.exports = mongoose.model("SubCategory", SubCategorySchema);
