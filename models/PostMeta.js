const mongoose = require("mongoose");

var postMetaSchema = mongoose.Schema({
  ["@type"]: String,
  title: String,
  description: String,
  baseSalary: {
    ["@type"]: String,
    currency: String,
    value: {
      ["@type"]: String,
      value: String,
      unitText: String,
      minValue: Number,
      maxValue: Number,
    },
  },
  datePosted: String,
  validThrough: String,
  employmentType: [String],
  hiringOrganization: {
    ["@type"]: String,
    name: String,
    sameAs: String,
    logo: String,
  },
  jobLocation: {
    ["@type"]: String,
    address: {
      ["@type"]: String,
      streetAddress: String,
      addressLocality: String,
      addressRegion: String,
      postalCode: String,
      addressCountry: String,
    },
  },
  jobLocationType: String,
  applicantLocationRequirements: [
    {
      "@type": {
        type: String,
      },
      name: { type: String },
    },
  ],
  experienceInPlaceOfEducation: String,
  educationRequirements: {
    ["@type"]: String,
    credentialCategory: String,
  },
  experienceRequirements: {
    ["@type"]: String,
    monthsOfExperience: String,
  },

  ["@id"]: String,
  mainEntityOfPage: {
    ["@id"]: String,
  },
});

module.exports = mongoose.model("PostMeta", postMetaSchema);
