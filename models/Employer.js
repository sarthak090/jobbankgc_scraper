const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const EmployerSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
  },
  website: {
    type: String,
  },
  logo: {
    type: String,
  },
  addresses: [
    {
      ["@type"]: String,
      streetAddress: String,
      addressLocality: String,
      addressRegion: String,
      postalCode: String,
      addressCountry: String,
    },
  ],
  address: {
    ["@type"]: String,
    streetAddress: String,
    addressLocality: String,
    addressRegion: String,
    postalCode: String,
    addressCountry: String,
  },
  jobs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
  ],
});

EmployerSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Employer", EmployerSchema);
