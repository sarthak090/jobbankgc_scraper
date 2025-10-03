require("dotenv").config();

var express = require("express");
var router = express.Router();
const db = require("../../models");
const { isAuthenticated } = require("../../middleware/authMiddleware");
router.get("/", isAuthenticated, async (req, res) => {
  const { page, limit } = req.query;
  // const paginated = await getPaginatedEmployers(page, limit);

  const paginated = await db.Employer.paginate(
    {},
    {
      page: page ? page : 1,
      limit: limit ? limit : 10,

      populate: {
        path: "jobs",
        select: "jobTitle",
      },

      sort: { "jobs.length": 1 },
    }
  );
  paginated.docs
    ?.sort((one, other) => one.jobs.length - other.jobs.length)
    ?.reverse();

  res.send(paginated);
});
router.get("/search", async (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.send({ message: "Error Please Provide Name For Search" });
  }
  const search = await findEmployersByNameWithJobCount(name);
  return res.send(search);
});

const findEmployersByNameWithJobCount = async (name) => {
  try {
    const employers = await db.Employer.aggregate([
      { $match: { name: { $regex: name, $options: "i" } } },
      {
        $lookup: {
          from: "jobs",
          localField: "jobs",
          foreignField: "_id",
          as: "jobCount",
        },
      },
      {
        $project: {
          name: 1,
          jobCount: { $size: "$jobCount" },
          website: 1,
          logo: 1,
        },
      },
      { $sort: { jobCount: -1 } }, // Sort by highest job count
    ]);

    return employers;
  } catch (error) {
    // Handle the error
    console.error(error);
  }
};

const searchEmployersByNameRegex = async (name) => {
  try {
    const employers = await db.Employer.find({
      name: { $regex: name, $options: "i" },
    })
      .limit(30)
      .select("-jobs");
    return employers;
  } catch (error) {
    // Handle the error
    console.error(error);
  }
};
router.get("/new", async (req, res) => {
  const { page, limit } = req.query;
  const totalEmployers = await db.Employer.countDocuments({});
  const paginated = await getPaginatedEmployers(page);

  if (paginated.length > 1) {
    const data = {
      docs: [...paginated],
      limit: 10,
      totalPages: Math.round(parseFloat(totalEmployers / 10)),
      page: parseFloat(page),
      pagingCounter: parseFloat(page),
      hasPrevPage: parseFloat(page) === 1 ? false : true,
      hasNextPage: parseFloat(page) >= 1 ? true : false,
      prevPage: parseFloat(page) <= 1 ? null : parseFloat(page) - 1,
      nextPage: parseFloat(page) + 1,
    };
    return res.send(data);
  } else {
    res.send({ message: "Error", paginated });
  }
});
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const _id = req.params.id;

    const employer = await db.Employer.findById(_id);

    res.send(employer);
  } catch (err) {
    res.status(404).json({ msg: "There was an error" });
  }
});

router.put("/:id", isAuthenticated, async (req, res) => {
  try {
    const _id = req.params.id;

    const employer = await db.Employer.findById(_id);
    employer.logo = req.body.logo;
    employer.save();

    await updateJobDetailsWithNewData(_id);
    res.send(employer);
  } catch (err) {
    res.status(404).json({ msg: "There was an error" });
  }
});
async function updateJobDetailsWithNewData(emmployerId) {
  const employer = await db.Employer.findOne({ _id: emmployerId });
  if (employer) {
    const employerLogo = employer.logo;
    const jobs = await db.Job.find({ employer: emmployerId });
    console.log(jobs.length);
    jobs.forEach(async (job) => {
      if (job.featuredImg !== employerLogo) {
        job.featuredImg = employerLogo;
      }
      if (job.jobPostingSchema.hiringOrganization.logo !== employerLogo) {
        job.jobPostingSchema.hiringOrganization.logo = employerLogo;
      }
      await job.save();
    });
    console.log("Updated Employer Images");
  }
}

async function getPaginatedEmployers(page = 1, limit = 10) {
  const pageSize = limit; // Adjust the page size as per your requirement
  const pageNumber = page; // Adjust the page number as per your requirement

  const pipeline = [
    {
      $lookup: {
        from: "jobs",
        localField: "jobs",
        foreignField: "_id",
        as: "jobs",
      },
    },
    {
      $match: {
        jobs: { $gt: [] },
      },
    },
    {
      $addFields: {
        jobCount: { $size: "$jobs" },
      },
    },
    {
      $unset: "jobs",
    },
    {
      $sort: { jobCount: -1 },
    },
    {
      $skip: (pageNumber - 1) * pageSize,
    },
    {
      $limit: pageSize,
    },
  ];

  // const perPage = limit;
  // const pageNumber = page;

  // const pipeline = [
  //   {
  //     $lookup: {
  //       from: "jobs",
  //       localField: "jobs",
  //       foreignField: "_id",
  //       as: "jobs",
  //     },
  //   },
  //   {
  //     $match: {
  //       jobs: { $gt: [] },
  //     },
  //   },
  //   {
  //     $sort: { jobCount: -1 },
  //   },
  //   {
  //     $addFields: {
  //       jobCount: { $size: "$jobs" },
  //     },
  //   },
  //   {
  //     $unset: "jobs",
  //   },
  //   {
  //     $facet: {
  //       docs: [{ $skip: (pageNumber - 1) * perPage }, { $limit: perPage }],
  //       metadata: [
  //         { $count: "totalDocuments" },
  //         {
  //           $addFields: {
  //             totalPages: { $ceil: { $divide: ["$totalDocuments", perPage] } },
  //           },
  //         },
  //       ],
  //     },
  //   },
  // ];
  const employers = await db.Employer.aggregate(pipeline).exec();
  return employers;
}
// async function updateJobs
module.exports = router;
