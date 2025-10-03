require("dotenv").config();

var express = require("express");
const { extractIDFromURL } = require("../../utils/helper");
const { sgbFetchById } = require("../../utils/scraper_sg");
const db = require("../../models");
var router = express.Router();
const chalk = require("chalk");
const {
  addJobToSGBDatabase,
  removeSGBJobById,
} = require("../../utils/sgb_helper");

router.get("/", async (req, res) => {
  if (!req.query.url) {
    const { page, limit } = req.query;
    const _jobs = await paginatedJobs({ page, limit });

    return res.status(200).send(_jobs);
  }
  const id = extractIDFromURL(req.query.url);
  if (!id || id.length == 0) {
    return res.send({ error: "Not A Valid Id of the job" });
  }
  try {
    const job = await db.SGJob.findOne({ id: id });
    if (job !== null) {
      console.log(job);
      return res.send(job);
    }
    if (req.query.url) {
      const response = await sgbFetchById(req.query.url);
      res.send(response);
      await addJobToSGBDatabase(response);
    } else {
      res.send({ msg: "No Url Was Given" });
    }
  } catch (err) {
    console.log(err);
    return res.send({ error: "Server Side Error" });
  }
});

router.get("/delete", async (req, res) => {
  if (req.query.id) {
    await removeSGBJobById(req.query.id);
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

const paginatedJobs = async (pagination) => {
  const { page, limit } = pagination;
  //   const filter = {
  //     jobRequirement_old: { $ne: null, $exists: true },
  //   };
  const paginated = await db.SGJob.paginate(
    {},
    {
      page: page ? page : 1,
      limit: limit ? limit : 10,
      sort: { _id: -1 },
    }
  );
  return paginated;
};
// async function updateJobs

router.get("/:id", async function (req, res, next) {
  try {
    let { regenerate, prompt } = req.query;
    regenerate == undefined ? (regenerate = false) : (regenerate = true);
    prompt === undefined ? (prompt = "") : null;

    const _job = await db.SGJob.findOne({ id: req.params.id });
    if (_job) {
      return res.send(_job);

      if (_job.introduction.length > 0) {
        console.log("Intro available", _job.jobRequirement_old?.length);
        if (
          _job.jobRequirement_old === undefined ||
          _job.jobRequirement_old.length === 0 ||
          regenerate
        ) {
          jobRequirement2 = await generateJobRequirementByChatGPT(_job, prompt);

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
          jobRequirement2 = await generateJobRequirementByChatGPT(_job, prompt);
          console.log({ jobRequirement2 });
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
      const _job = await db.SGJob.findOne({ _id: req.params.id });
      if (_job !== null) {
        return res.send(_job);
      }
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
