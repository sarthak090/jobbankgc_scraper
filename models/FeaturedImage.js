const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

var featuredImgSchema = new mongoose.Schema({
  src: {
    type: String,
    unique: true,
    required: true,
  },
});

module.exports = mongoose.model("FeaturedImage", featuredImgSchema);
