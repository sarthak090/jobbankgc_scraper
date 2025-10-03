const mongoose = require("mongoose");

var MetatitleSchema = new mongoose.Schema({
  title: {
    type: String,
    
    required: true,
  },
});

module.exports = mongoose.model("MetaTitle", MetatitleSchema);
