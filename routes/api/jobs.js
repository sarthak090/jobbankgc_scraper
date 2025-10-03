require("dotenv").config();
const chalk = require("chalk");

var express = require("express");
var router = express.Router();
const { getJobSchemaById } = require("../../utils/scraper");
const db = require("../../models");
const {
  getAllLinks,
  removeById,
  createEmployerSchema,
  fetchJobBankJobs,
  addNewJobToDB,
  formatter,
  updateNullJobRequirement,
  getAllTheUndefinedOrNullOrOldJobRequirement,
  getLMIAJobs,
  getJobsByType,
  searchJobsByTitleOrEmployer,
} = require("../../utils/helper");
const { Configuration, OpenAIApi } = require("openai");
const cheerio = require("cheerio");
const { sgbFetchById } = require("../../utils/scraper_sg");
const config = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});

const { isAuthenticated } = require("../../middleware/authMiddleware");
const { generateIntroduction } = require("../../utils/chatgpt");
const { createKeyValuePair } = require("../../utils/sentences/keyValue");
const jobRequrementGenerator = require("../../utils/jobRequirementGenerator");
const { 
  addNewSentences, 
} = require("../../utils/sentences/sentences");
const { getEmployerWithDifferentLocation } = require("../../utils/DBformatter");
const { updateLMIAbyId } = require("../../utils/lmiaUpdater");
const { flattenObject } = require("../../utils/methods");

router.get("/", isAuthenticated, async function (req, res, next) {
  if (!req.query.id) {
    const { page, limit } = req.query;
    const _jobs = await paginatedJobs({ page, limit });

    return res.status(200).send(_jobs);
  }
  const _jobs = await db.Job.findOne({ id: req.query.id });

  if (_jobs) {
    return res.send(_jobs);
  } else {
    const job = await getJobSchemaById(req.query.id);

    res.send(job);
    await addNewJobToDB(job);
  }
});

const paginatedJobs = async (pagination) => {
  const { page, limit } = pagination;
  const filter = {
    jobRequirement_old: { $ne: null, $exists: true },
  };
  const paginated = await db.Job.paginate(filter, {
    page: page ? page : 1,
    limit: limit ? limit : 10,
    sort: { _id: -1 },
    projection: { _id: 0 }, // Exclude _id field from the response
    select: "-jobPostingSchema._id", // Exclude _id field from jobPostingSchema
  });
  return paginated;
};

router.get("/id/:id", isAuthenticated, async function (req, res) {
  const job = await db.Job.findById(req.params.id);
  if (job) {
    res.send(job);
  } else {
    res.send({ msg: `No Job Found` });
  }
});
router.get("/check-address", async (req, res) => {
  const jobs = await getEmployerWithDifferentLocation();
  res.send(jobs);
});
router.get("/test", async function (req, res) {
  if (!req.query.id) {
    return res.render("error");
  }
  try {
    const job = await getJobSchemaById(req.query.id);

    res.send(job);
  } catch (err) {
    console.log(err)
    console.log(err.data);
    res.status(500).send({ message: "There is some internal server error" });
  }
});

router.get("/update-lmia/:id", async (req, res) => {
  try {
    await updateLMIAbyId(req.params.id, true);
    res.send({ message: `The Job is being Updated` });
  } catch (err) {
    res.send({ message: "Some Error.." });
  }
});
router.get("/all", isAuthenticated, async function (req, res, next) {
  const { page, limit } = req.query;

  const paginated = await db.Job.paginate(
    {},
    {
      page: page ? page : 1,
      limit: limit ? limit : 10,
    }
  );

  res.send(paginated);
});

router.get("/scrape-sgb", async (req, res) => {
  try {
    if (req.query.url) {
      const response = await sgbFetchById(req.query.url);
      res.send(response);
    } else {
      res.send({ msg: "No Url Was Given" });
    }
  } catch (err) {
    console.log(err);
    res.render("error");
  }
});
router.get("/null-jobs-length", async (req, res) => {
  const oldJobs = await db.Job.countDocuments({
    jobRequirement_old: { $in: [undefined, null] },
  });
  res.send({
    message: `Total Jobs left to be updated ${oldJobs}`,
  });
});
router.get("/rescrape", async (req, res) => {
  const oldJobs = await db.Job.countDocuments({ regenerated: undefined });
  res.send({
    message: `Total Jobs left to be rescraped ${oldJobs}`,
  });
});
function remove() {
  db.Job.deleteMany({}).then((r) => console.log(r));
}

router.get("/delete", isAuthenticated, async (req, res) => {
  if (req.query.id) {
    await removeById(req.query.id);
    res.send({
      msg: "Job was removed",
    });
  } else {
    res.send({
      error: true,
      msg: "There was some error",
    });
  }
});

router.get("/demo", async function (req, res, next) {
  const job = await getJobSchemaById(req.query.id);
  res.render("index", { job });
});

router.get("/employers", async function (req, res, next) {
  const job = await db.Employer.find({}).sort("-1");
  job
    .sort(function (one, other) {
      return one.jobs.length - other.jobs.length;
    })
    .reverse();
  res.send(job);
});

router.get("/fetch-posts", async (req, res) => {
  if (!req.query.url) {
    return res.render("error");
  }
  if (req.query.url) {
    const links = await getAllLinks(req.query.url);

    links.map(async (id) => {
      try {
        const checkIfExist = await db.Job.find({ id: id });

        if (checkIfExist.length === 0) {
          const j = await getJobSchemaById(id);
          await db.Job.create(j);
        } else {
          console.log("Already In Database");
        }
      } catch (err) {
        console.log("Error", err);
      }
    });
    return res.send({ links });
  }

  return res.send({ error: "No Url Was Provided" });
});

router.get("/null-jobs", async (req, res) => {
  const result = await getAllTheUndefinedOrNullOrOldJobRequirement();
  return res.send(result);
});

// test();
router.get("/cron", async (req, res) => {
  await fetchJobBankJobs(
    `https://www.jobbank.gc.ca/jobsearch/jobsearch?page=1&sort=M&fsrc=16`
  );
  res.send({
    message: "Added Jobs that are verified and not present in our database",
  });
});

router.get("/null-emp", async (req, res) => {
  const jobsWithEmployer = await db.Job.find({})
    .where("employer")
    .equals(undefined)
    .limit(5);
  res.send(jobsWithEmployer);
});

// updateMetaWithIntro();
router.get("/check/:id", async (req, res) => {
  const job = await db.Job.findOne({ id: req.params.id });

  const keyValue = createKeyValuePair(cheerio.load(job.jobRequirement_old));
  await addNewSentences(keyValue);

  res.send(keyValue);
});
router.get("/update-new", async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Current page number, defaulting to 1 if not provided
  const limit = parseInt(req.query.limit) || 10; // Number of documents to display per page, defaulting to 10 if not provided

  const skip = (page - 1) * limit;

  const totalCount = await db.Job.countDocuments({});
  const totalPages = Math.ceil(totalCount / limit);
  try {
    const jobs = await db.Job.find({
      jobRequirement_old: { $ne: null, $exists: true },
    })
      .skip(skip)
      .limit(limit)
      .select("jobRequirement_old")
      .sort("-date");
    jobs.forEach(async (job) => {
      const keyValue = createKeyValuePair(cheerio.load(job.jobRequirement_old));
      // const job_requirement_test = await jobRequrementGenerator(keyValue);
      await addNewSentences(keyValue);
    });

    res.send({
      jobs,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    res.status(503).send({ message: "There was some error please try again" });
  }
});

router.get("/update-featured-images", async (req, res) => {
  try {
    const newFeaturedImage = await db.FeaturedImage.find({}).limit(1); // Provide the new featured image URL

    const featureImage = newFeaturedImage[0].src;
    const filter = {
      featuredImg:
        "https://jobbank.ai/wp-content/uploads/2023/05/JobBank-AI.jpg",
    };
    // Update all jobs with the new featured image
    const updateResult = await db.Job.updateMany(filter, {
      $set: { featuredImg: featureImage },
    });

    res.json({
      message: `${updateResult.modifiedCount} jobs updated with the new featured image. `,
    });
    // res.json({msg:featureImage})
  } catch (err) {
    res.json({ error: "Internal Server Error" });
  }
});
router.get("/generate-job-requirement/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const job = await db.Job.findOne({ id });
    const keyValue = createKeyValuePair(cheerio.load(job.jobRequirement_old));
    const job_requirement_test = await jobRequrementGenerator(keyValue);

    res.send({ job_requirement_test });
  } catch (err) {
    res.status(503).send({ message: "There was some error please try again" });
  }
});

router.get("/emp", async (req, res) => {
  const { name } = req.query;
  if (name) {
    const employer = await db.Job.find({
      "jobPostingWidget.employerName": name,
    });
    res.send(employer);
    // if (employer) {
    //   res.send(jobs);
    // } else {
    //   res.send({ message: "Not in database" });
    // }
  } else {
    res.send("Error");
  }
});
router.post("/", async function (req, res, next) {
  const job = await getJobSchemaById(req.query.id);
  await db.Job.create(job);
  res.send(job);
});
// updateMetaTitle();

router.get('/app/search',async(req,res)=>{
   if(req.query.query){
    const {query,page} = req.query;
    const jobs= await searchJobsByTitleOrEmployer(query,page)
    return res.send(jobs)
  }else{
    res.send({status:404,message:'Provide A Valid Query'})
  }
})
router.get('/app/type',async(req,res)=>{
  if(req.query.type){
    const {type,page} = req.query;

    if(type==="lmia"){
      const jobs= await getLMIAJobs(page)
      return res.send(jobs)
    }
    const jobs = await getJobsByType(type,page)
    res.send(jobs)


  }else{
    res.send({status:404,message:'Please Provide Valid Post Type'})
  }
})
router.get('/app/:id',async(req,res)=>{
  const _job = await db.Job.findOne({ id: req.params.id }).select(
    "-jobPostingSchema._id"
  );
  if (_job) {
    const jobPostingDescHTML = cheerio.load(_job.jobRequirement_old, null, false);

    const job  = {
      ..._job._doc,
      keyValue:flattenObject( createKeyValuePair(jobPostingDescHTML))
    }
    res.send(job)
  }else {
    res.status(404).send({
      error: true,
      msg: "Not is  Database",
    });
  }
})



router.get('/scrape/:id',async(req,res)=>{
  const {id} = req.params;
  const job = await getJobSchemaById(id);
  res.send(job)
})
router.get("/:id", async function (req, res, next) {
  try {
    let { regenerate, prompt } = req.query;
    regenerate == undefined ? (regenerate = false) : (regenerate = true);
    prompt === undefined ? (prompt = "") : null;

    const _job = await db.Job.findOne({ id: req.params.id }).select(
      "-jobPostingSchema._id"
    );
    if (_job) {
      if (_job.introduction.length > 0) {
        console.log("Intro available", _job.jobRequirement_old?.length);
        if (
          _job.jobRequirement_old === undefined ||
          _job.jobRequirement_old.length === 0 ||
          regenerate
        ) {
          const keyValue = createKeyValuePair(
            cheerio.load(_job.jobRequirement)
          );

          const description = await jobRequrementGenerator(keyValue);
          jobRequirement2 = description;
          const jobPostingDescHTML = cheerio.load(description, null, false);
          jobPostingDescHTML(".remove-for-description").remove();

          _job.jobPostingSchema.description = jobPostingDescHTML.html();

          if (
            jobRequirement2?.length > 0 &&
            _job.jobRequirement_old == undefined
          ) {
            _job.jobRequirement_old = _job.jobRequirement;
          }
          const textToSave =
            jobRequirement2.length > 0 ? jobRequirement2 : _job.jobRequirement;
          _job.jobRequirement = formatter(textToSave);
          _job.save();
          return res.send(_job);
        }
        return res.send(_job);
      } else {
        const introduction = await generateIntroduction(_job);
        if (
          _job.jobRequirement_old === undefined ||
          _job.jobRequirement_old.length === 0
        ) {
          const keyValue = createKeyValuePair(
            cheerio.load(_job.jobRequirement)
          );

          const description = await jobRequrementGenerator(keyValue);
          jobRequirement2 = description;
          const jobPostingDescHTML = cheerio.load(description, null, false);
          jobPostingDescHTML(".remove-for-description").remove();

          _job.jobPostingSchema.description = jobPostingDescHTML.html();

          if (
            jobRequirement2?.data?.choices.length > 0 &&
            _job.jobRequirement_old == undefined
          ) {
            _job.jobRequirement_old = _job.jobRequirement;
          }
          const textToSave =
            jobRequirement2?.data?.choices.length > 0
              ? jobRequirement2?.data?.choices[0].text
              : _job.jobRequirement;
          _job.jobRequirement = formatter(textToSave);
        }
        _job.introduction =
          introduction?.data?.choices.length > 0
            ? introduction?.data?.choices[0].text
            : "";
        _job.meta.description =
          introduction?.data?.choices.length > 0
            ? introduction?.data?.choices[0].text
            : _job.meta.description;
        res.send({ _job });
        _job.save();

        return;
      }
    } else {
      res.status(404).send({
        error: true,
        msg: "Not is  Database",
      });
    }
  } catch (err) {
    console.log({ err });
    res.status(404).send({
      error: true,
      msg: "Not is  Database",
    });
  }
});

module.exports = router;
