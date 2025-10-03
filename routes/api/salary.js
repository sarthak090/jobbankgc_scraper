require("dotenv").config();

var express = require("express");
var router = express.Router();
const db = require("../../models");

router.get("/all-name", async (req, res) => {
  try {
    const baseLink = "https://api.jobbank.ai/api/salary/all-schema?name="; // Replace this with the base URL for the job links

    const pipeline = [
      {
        $group: {
          _id: "$jobTitle",
          totalCount: { $sum: 1 },
        },
      },
      {
        $match: {
          totalCount: { $gt: 10 }, // Filter out job titles with count <= 10
        },
      },
      {
        $sort: {
          totalCount: -1, // Sort by totalCount in descending order
        },
      },
      {
        $project: {
          _id: 0,
          jobTitle: "$_id",
          totalCount: 1,
          link: {
            $concat: [baseLink, { $toLower: "$_id" }],
          },
        },
      },
    ];

    const result = await db.Job.aggregate(pipeline);
    res.send(result);
  } catch (err) {
    console.log(err);
    res.send({ message: "There is some error" });
  }
});
router.get("/all", async (req, res) => {
  try {
    const { name, location } = req.query;
    if (!name && !location) {
      res.send({ message: "Need of atleast one query param" });
    }

    if (name) {
      const searchRegex = name; // Replace this with the desired regex pattern for the job title search

      const pipeline = [
        {
          $match: {
            jobTitle: { $regex: searchRegex, $options: "i" }, // 'i' option for case-insensitive search
            "jobPostingSchema.baseSalary.value.unitText": "HOUR", // Filter by unitText equal to "HOUR"
          },
        },
        {
          $addFields: {
            lastSalaryPart: {
              $let: {
                vars: {
                  parts: {
                    $split: [
                      {
                        $ifNull: [
                          "$jobPostingSchema.baseSalary.value.value",
                          "",
                        ],
                      },
                      "-",
                    ],
                  },
                },
                in: { $arrayElemAt: ["$$parts", -1] },
              },
            },
          },
        },
        {
          $addFields: {
            numericSalary: {
              $convert: {
                input: "$lastSalaryPart",
                to: "double",
                onError: 0, // Set to 0 if the conversion fails
                onNull: 0, // Set to 0 if the field is null
              },
            },
          },
        },
        {
          $match: {
            $and: [
              { numericSalary: { $gte: 0 } }, // Filter out negative values
              { numericSalary: { $lte: 9999.99 } }, // Consider only values up to 9999.99
            ],
          },
        },
        {
          $group: {
            _id: null,
            averageSalary: { $avg: "$numericSalary" },
          },
        },
        {
          $project: {
            _id: 0,
            averageSalary: { $round: ["$averageSalary", 2] }, // Round to two decimal points
          },
        },
      ];

      if (location) {
        // Add the location filtering condition if 'location' is provided
        pipeline[0].$match.$or = [
          { "jobPostingSchema.jobLocation.address.addressLocality": location },
          { "jobPostingSchema.jobLocation.address.addressRegion": location },
        ];
      }
      const jobs = await db.Job.aggregate(pipeline);
      const { averageSalary } = jobs[0];
      const schema = occupationSchema({
        name,
        location,
        salary: averageSalary,
      });
      return res.send({ schema });
    }
  } catch (err) {
    console.log(err);
    res.send({ message: "There is some error" });
  }
});
router.get("/all-schema", async (req, res) => {
  try {
    const { name, location } = req.query;
    if (!name && !location) {
      res.send({ message: "Need of atleast one query param" });
    }

    if (name) {
      const searchRegex = name; // Replace this with the desired regex pattern for the job title search

      const pipeline = [
        {
          $match: {
            jobTitle: { $regex: searchRegex, $options: "i" }, // 'i' option for case-insensitive search
            "jobPostingSchema.baseSalary.value.unitText": "HOUR", // Filter by unitText equal to "HOUR"
          },
        },
        {
          $addFields: {
            lastSalaryPart: {
              $let: {
                vars: {
                  parts: {
                    $split: [
                      {
                        $ifNull: [
                          "$jobPostingSchema.baseSalary.value.value",
                          "",
                        ],
                      },
                      "-",
                    ],
                  },
                },
                in: { $arrayElemAt: ["$$parts", -1] },
              },
            },
          },
        },
        {
          $addFields: {
            numericSalary: {
              $convert: {
                input: "$lastSalaryPart",
                to: "double",
                onError: 0, // Set to 0 if the conversion fails
                onNull: 0, // Set to 0 if the field is null
              },
            },
          },
        },
        {
          $match: {
            $and: [
              { numericSalary: { $gte: 0 } }, // Filter out negative values
              { numericSalary: { $lte: 9999.99 } }, // Consider only values up to 9999.99
            ],
          },
        },
        {
          $group: {
            _id: location ? null : "$jobPostingSchema.jobLocation",
            averageSalary: { $avg: "$numericSalary" },
          },
        },
        {
          $project: {
            _id: 0,
            jobLocation: location ? null : "$_id",
            averageSalary: { $round: ["$averageSalary", 2] }, // Round to two decimal points
          },
        },
      ];

      // if (location) {
      //   // Add the location filtering condition if 'location' is provided
      //   pipeline[0].$match.$or = [
      //     { "jobPostingSchema.jobLocation.address.addressLocality": location },
      //     { "jobPostingSchema.jobLocation.address.addressRegion": location },
      //   ];
      // }
      const jobs = await db.Job.aggregate(pipeline);
      // const { averageSalary } = jobs[0];
      // const schema = occupationSchema({
      //   name,
      //   location,
      //   salary: averageSalary,
      // });
      const formatted = jobs.map((job) => ({
        averageSalary: job.averageSalary,
        schema: occupationSchema({
          salary: job.averageSalary,
          name,
          location: job.jobLocation.address.addressLocality,
        }),
      }));
      return res.send(formatted);
    }
  } catch (err) {
    console.log(err);
    res.send({ message: "There is some error" });
  }
});

function getCurrentFormattedDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const formattedDate = `${year}-${month}-${day}T00:00:00`;
  return formattedDate;
}

function occupationSchema({ salary, name, location }) {
  const schema = `{
    "@context": "https://schema.org/",
    "@type": "Occupation",
    "name": "${name}",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "lastReviewed": "2023-07-19T00:00:00"
    },
    "estimatedSalary": [
      {
        "@type": "MonetaryAmountDistribution",
        "name": "base",
        "currency": "CAD",
        "duration": "P1H",
        "minValue": ${salary},
        "maxValue": ${salary},
        "median": ${salary}
      }
    ],
    "occupationLocation": [{ "@type": "City", "name": "${
      location ? location : "Canada"
    }" }]
  }
    
  `;

  return schema;
}

router.get("/all-bk", async (req, res) => {
  try {
    const { name, location } = req.query;
    if (!name && !location) {
      res.send({ message: "Need of atleast one query param" });
    }

    if (name) {
      const searchRegex = name; // Replace this with the desired regex pattern for the job title search

      const pipeline = [
        {
          $match: {
            jobTitle: { $regex: searchRegex, $options: "i" }, // 'i' option for case-insensitive search
            "jobPostingSchema.baseSalary.value.unitText": "HOUR", // Filter by unitText equal to "HOUR"
          },
        },
        {
          $addFields: {
            lastSalaryPart: {
              $let: {
                vars: {
                  parts: {
                    $split: [
                      {
                        $ifNull: [
                          "$jobPostingSchema.baseSalary.value.value",
                          "",
                        ],
                      },
                      "-",
                    ],
                  },
                },
                in: { $arrayElemAt: ["$$parts", -1] },
              },
            },
          },
        },
        {
          $addFields: {
            numericSalary: {
              $convert: {
                input: "$lastSalaryPart",
                to: "double",
                onError: 0, // Set to 0 if the conversion fails
                onNull: 0, // Set to 0 if the field is null
              },
            },
          },
        },
        {
          $match: {
            $and: [
              { numericSalary: { $gte: 0 } }, // Filter out negative values
              { numericSalary: { $lte: 9999.99 } }, // Consider only values up to 9999.99
            ],
          },
        },
        {
          $group: {
            _id: null,
            averageSalary: { $avg: "$numericSalary" },
          },
        },
        {
          $project: {
            _id: 0,
            averageSalary: { $round: ["$averageSalary", 2] }, // Round to two decimal points
          },
        },
      ];

      if (location) {
        // Add the location filtering condition if 'location' is provided
        pipeline[0].$match.$or = [
          { "jobPostingSchema.jobLocation.address.addressLocality": location },
          { "jobPostingSchema.jobLocation.address.addressRegion": location },
        ];
      }
      const jobs = await db.Job.aggregate(pipeline);
      return res.send(jobs);
    }
  } catch (err) {
    console.log(err);
    res.send({ message: "There is some error" });
  }
});
router.get("/check", async (req, res) => {
  try {
    const { name, location } = req.query;
    if (name) {
      const searchRegex = name; // Replace this with the desired regex pattern for the job title search
      let pipeline = [
        {
          $match: {
            jobTitle: { $regex: searchRegex, $options: "i" }, // 'i' option for case-insensitive search
            "jobPostingSchema.baseSalary.value.unitText": "HOUR", // Filter by unitText equal to "HOUR"
          },
        },
        {
          $addFields: {
            numericMinSalary: {
              $toDouble: {
                $cond: {
                  if: {
                    $regexMatch: {
                      input: {
                        $ifNull: [
                          "$jobPostingSchema.baseSalary.value.value",
                          "",
                        ],
                      },
                      regex: /^\d+(\.\d{1,2})?$/,
                    },
                  },
                  then: {
                    $toDouble: "$jobPostingSchema.baseSalary.value.value",
                  },
                  else: 0,
                },
              },
            },
            numericMaxSalary: {
              $toDouble: {
                $cond: {
                  if: {
                    $regexMatch: {
                      input: {
                        $ifNull: [
                          "$jobPostingSchema.baseSalary.value.value",
                          "",
                        ],
                      },
                      regex: /^\d+(\.\d{1,2})?-\d+(\.\d{1,2})?$/,
                    },
                  },
                  then: {
                    $toDouble: {
                      $arrayElemAt: [
                        {
                          $split: [
                            {
                              $replaceAll: {
                                input:
                                  "$jobPostingSchema.baseSalary.value.value",
                                find: ",",
                                replacement: "",
                              },
                            },
                            "-",
                          ],
                        },
                        1,
                      ],
                    },
                  },
                  else: 0,
                },
              },
            },
          },
        },
        {
          $match: {
            $expr: {
              $and: [
                { $gte: ["$numericMinSalary", 0] }, // Filter out negative values
                { $lte: ["$numericMinSalary", 9999.99] }, // Consider only values up to 9999.99
                { $gte: ["$numericMaxSalary", 0] }, // Filter out negative values
                { $lte: ["$numericMaxSalary", 9999.99] }, // Consider only values up to 9999.99
                { $gte: ["$numericMaxSalary", "$numericMinSalary"] }, // Filter out invalid ranges (max should be greater than or equal to min)
              ],
            },
          },
        },
        {
          $addFields: {
            averageSalary: { $avg: ["$numericMinSalary", "$numericMaxSalary"] },
          },
        },

        {
          $project: {
            jobTitle: 1,
            averageSalary: 1,
          },
        },
      ];
      if (location) {
        // Add the location filtering condition if 'location' is provided
        pipeline[0].$match.$or = [
          { "jobPostingSchema.jobLocation.address.addressLocality": location },
          { "jobPostingSchema.jobLocation.address.addressRegion": location },
        ];
      }
      const jobs = await db.Job.aggregate(pipeline);
      const resp = {
        avg: calculateAverageAverageSalary(jobs),
      };
      res.send(jobs);
    } else {
      res.send({ message: "There was some error" });
    }
  } catch (err) {
    console.log(err);
    res.send({ message: "There was some error" });
  }
});

router.get("/search", async (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.send({ message: "Provide Name" });
  }
  try {
    const jobs = await db.Job.find({
      jobTitle: { $regex: name, $options: "i" }, // 'i' option for case-insensitive search
    })
      .limit(10)
      .select("jobPostingWidget.salary");
    res.send(jobs);
  } catch (err) {
    res.send({ message: "There is some error" });
  }
});
function calculateAverageAverageSalary(jobsArray) {
  if (!jobsArray || !Array.isArray(jobsArray) || jobsArray.length === 0) {
    return 0;
  }

  let totalAverageSalary = 0;
  jobsArray.forEach((job) => {
    totalAverageSalary += job.averageSalary;
  });

  const average = totalAverageSalary / jobsArray.length;
  return parseFloat(average.toFixed(2));
}
async function getAverages(name) {
  const searchRegex = name; // Replace this with the desired regex pattern for the job title search

  const jobs = await db.Job.aggregate([
    {
      $match: {
        jobTitle: { $regex: searchRegex, $options: "i" }, // 'i' option for case-insensitive search
        "jobPostingSchema.baseSalary.value.unitText": "HOUR", // Filter by unitText equal to "HOUR"
      },
    },
    {
      $addFields: {
        salaryRangeParts: {
          $split: [
            {
              $ifNull: ["$jobPostingSchema.baseSalary.value.value", "0-0"],
            },
            "-",
          ],
        },
      },
    },
    {
      $addFields: {
        numericMinSalary: {
          $toDouble: { $arrayElemAt: ["$salaryRangeParts", 0] },
        },
        numericMaxSalary: {
          $toDouble: { $arrayElemAt: ["$salaryRangeParts", 1] },
        },
      },
    },
    {
      $addFields: {
        averageSalary: { $avg: ["$numericMinSalary", "$numericMaxSalary"] },
      },
    },
    {
      $project: {
        jobTitle: 1,
        averageSalary: 1,
      },
    },
  ]);

  return jobs;
}
router.get("/:jobid", async (req, res) => {
  try {
    const job = await db.Job.findOne({ id: req.params.jobid });
    if (job) {
      const code = generateOccupationSchema(job);
      res.send({ schema: code.toString() });
    } else {
      res.status(404).send({ message: "Not available in database" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Server Error" });
  }
});
function generateOccupationSchema(job) {
  const name = job.jobTitle;
  const description = job.introduction;
  const location = job.jobPostingSchema.jobLocation.address.addressLocality;
  const salary = job.jobPostingSchema.baseSalary.value;
  const schema = `{
        "@context": "https://schema.org/",
        "@type": "Occupation",
        "name": "${name}",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "lastReviewed": "2017-07-23T14:20:00-05:00"
        },
        "description": "${description}",
        "estimatedSalary": [
          {
            "@type": "MonetaryAmountDistribution",
            "name": "base",
            "currency": "CAD",
            "duration": "PT1H",
            "maxValue":${salary.value},
            "minValue":${salary.value},
            "value":"${salary}"
          }
        ],
        "occupationLocation": [
          {
            "@type": "City",
            "name": "${location}"
          }
        ]
      }`;
  return schema;
}
module.exports = router;
