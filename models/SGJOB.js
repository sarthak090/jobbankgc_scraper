const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const PostMeta = require("./PostMeta");

const SGJobSchema = new mongoose.Schema({
  id: {
    type: String,
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employer",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  jobPostingWidget: {
    employerName: {
      type: String,
    },
    website: {
      type: String,
    },
    vacancy: {
      type: String,
    },
    salary: {
      type: String,
    },
    jobType: {
      type: String,
    },
    shift: {
      type: String,
    },
    joblocation: {
      type: String,
    },
  },
  jobRequirement_old: {
    type: String,
  },
  jobRequirement: {
    type: String,
  },
  featuredImg: {
    type: String,
  },
  jobTitle: {
    type: String,
  },

  introduction: {
    type: String,
  },
  requiredDocuments: {
    instructionsList: { type: String },
    referenceNumber: { type: String },
  },
  howToApply: {
    type: String,
  },

  howToApplySchema: {
    emailToApply: { type: String },
    applyByMail: { type: String },
    applyByfax: { type: String },
    applyInPerson: { type: String },
    applyOnline: { type: String },
    applyByPhone: { type: String },
  },
  meta: {
    id: { type: String },
    title: { type: String },
    description: { type: String },
    slug: { type: String },
  },

  jobPostingSchema: {
    type: PostMeta.schema,
  },
});

SGJobSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("SGJob", SGJobSchema);
