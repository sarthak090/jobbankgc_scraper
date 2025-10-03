require("dotenv").config();

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
} = require("../../utils/helper");
const { Configuration, OpenAIApi } = require("openai");
const cheerio = require("cheerio");
const { sgbFetchById } = require("../../utils/scraper_sg");
const config = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});
var cron = require("node-cron");
const { isAuthenticated } = require("../../middleware/authMiddleware");

const openai = new OpenAIApi(config);

router.get("/", async function (req, res, next) {
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

  const paginated = await db.Job.paginate(
    {},
    {
      page: page ? page : 1,
      limit: limit ? limit : 10,
      sort: "-1",
    }
  );
  return paginated;
};
router.get("/id/:id", async function (req, res) {
  const job = await db.Job.findById(req.params.id);
  if (job) {
    res.send(job);
  } else {
    res.send({ msg: `No Job Found` });
  }
});
router.get("/test", async function (req, res) {
  if (!req.query.id) {
    return res.render("error");
  }

  const job = await getJobSchemaById(req.query.id);

  res.send(job);
});
const t = cheerio
  .load(
    `<h3> Overview </h3><div id="comparisonchart" class="comparisonchart"> <h4>Languages</h4> <p property="qualification">French</p> <h4>Education</h4> <ul property="educationRequirements qualification" class="csvlist "> <li> <span class="wb-inv"></span> <span>College, CEGEP or other non-university certificate or diploma from a program of 1 year to 2 years</span> </li> <li>or equivalent experience</li> </ul> <h4>Experience</h4> <p property="experienceRequirements qualification"> <span class="wb-inv"></span> <span>7 months to less than 1 year</span> </p> <div property=""> <h4>Work setting</h4> <ul class="csvlist"> <li> <span>Government department and/or agency</span> </li> <li> <span>Hospital or home for the aged</span> </li> <li> <span>Nursing home/home for the aged</span> </li> <li> <span>Private residence</span> </li> </ul> </div> <div property="responsibilities"> <h3>Responsibilities</h3> <h4>Tasks</h4> <ul class="csvlist"> <li> <span>Assess patients to identify appropriate nursing interventions</span> </li> <li> <span>Collaborate to plan, implement, co-ordinate and evaluate patient care</span> </li> <li> <span>Dispense and administer medications and treatments as prescribed by a physician</span> </li> <li> <span>Monitor, assess, address, document and report symptoms and changes in patients' conditions</span> </li> <li> <span>Provide nursing care</span> </li> <li> <span>Supervise licensed practical nurses and other nursing staff</span> </li> </ul> </div> <div property="skills"> <h3>Credentials</h3> <h4>Certificates, licences, memberships, and courses&nbsp;</h4> <ul class="csvlist"> <li> <span>CPR Certificate</span> </li> <li> <span>Licensure as a Registered Nurse by provincial or territorial authorities</span> </li> </ul> </div> <div property="skills"> </div></div>`
  )
  .text();

router.get("/openai", async function (req, res) {
  try {
    const openaiRes = await openai.createCompletion({
      model: "text-davinci-003",

      prompt: `rewrite the following content in job posting manner ${t}`,
      max_tokens: 1700,
    });
    return res.status(200).json({
      sucess: true,
      data: openaiRes.data,
    });
  } catch (err) {
    res.send({
      error: true,
      msg: "There is Some issue",
      err: err,
    });
  }
});

router.get("/all", async function (req, res, next) {
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
    const response = await sgbFetchById();
    res.send(response);
  } catch (err) {
    console.log(err);
    res.render("error");
  }
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

cron.schedule("34 * * * *", async () => {
  fetchJobBankJobs("https://www.jobbank.gc.ca/jobsearch/?page=1&sort=D");
  fetchJobBankJobs(
    "https://www.jobbank.gc.ca/jobsearch/jobsearch?sort=M&fsrc=16"
  );
  createEmployerSchema();
});

router.post("/", async function (req, res, next) {
  const job = await getJobSchemaById(req.query.id);
  await db.Job.create(job);
  res.send(job);
});

router.get("/:id", async function (req, res, next) {
  try {
    const _jobs = await db.Job.findOne({ id: req.params.id });

    if (_jobs) {
      return res.send(_jobs);
    } else {
      res.status(404).send({
        error: true,
        msg: "Not is  Database",
      });
    }
  } catch (err) {
    res.status(404).send({
      error: true,
      msg: "Not is  Database",
    });
  }
});

module.exports = router;
