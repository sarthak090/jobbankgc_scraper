const axios = require("axios");
const cheerio = require("cheerio");
const db = require("../models/");
const chalk = require("chalk");

const { getJobSchemaById } = require("./scraper");
const { generateIntroduction } = require("./sentences");
// const { capitalizeFirstLetter } = require("./sentences");
const { createKeyValuePair } = require("./sentences/keyValue");
const jobRequrementGenerator = require("./jobRequirementGenerator");
const defaultimgs = require("../data/links.json");
const { updateOldFeaturedImage } = require("./DBformatter");
 
const prevImg = `https://jobbank.ai/wp-content/uploads/2023/05/jb-logo-2.png`;
const defaultLogo =
  defaultimgs[0] ||
  `https://jobbank.ai/wp-content/uploads/2023/05/JobBank-AI.jpg`;
function formatter(text = "") {
  const y = `Please note that the provided job requirements and responsibilities are for illustrative purposes only and may not encompass all specific requirements of a particular job posting. It is advisable to refer to official job advertisements or contact the relevant employer for accurate and up-to-date information regarding job requirements and responsibilities.`;
  return text
    .replace(y, "")
    .replace("Overview", "")
    .replace("Overview ", "")
    .replace("Version 1:", "")
    .replace(`First Version:`, "")
    .replace(`First Version:`, "")
    .replace(`First version:`, "")
    .replace(`First version: Overview`, "")
    .replace(`undefined `, "");
}
async function getAllLinks(url) {
  const res = await axios(url, {
    headers: {
      "ISTL-INFINITE-LOOP": url,
    },
  });
  const $ = cheerio.load(res.data);

  const hrefLinksOf = $("a.resultJobItem");

  let linksToFetch = [];

  hrefLinksOf.each((i, el) => {
    linksToFetch.push($(el).parent().attr("id").split("-").slice(-1)[0]);
  });

  const filteredLinks = await getNonExistingIDs(linksToFetch);
  return filteredLinks;
}

async function getNonExistingIDs(idArray) {
  try {
    const numericIDs = idArray.map((id) => parseInt(id));
    const jobs = await db.Job.find({ id: { $in: numericIDs } }).lean();
    const existingIDs = jobs.map((job) => job.id);
    const nonExistingIDs = numericIDs.filter((id) => !existingIDs.includes(id));
    return nonExistingIDs;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
async function updateJobWithEmployeSchema() {
  const jobsWithEmployer = await db.Job.find({})
    .where("employer")
    .ne(undefined)
    .populate("employer");
  jobsWithEmployer.forEach(async (job) => {
    if (job.jobPostingSchema) {
      const { hiringOrganization } = job.jobPostingSchema;
      const { employer } = job;
      // const defaultLogo = `https://canadajobbank.org/wp-content/uploads/2021/06/Canada-Job-Bank.jpg`;
      // const defaultLogo2 = `https://jobbank.ai/wp-content/uploads/2023/05/JobBank-AI.jpg`;
      // if (
      //   hiringOrganization.logo !== employer.logo &&
      //   employer.logo !== defaultLogo &&
      //   employer.logo !== defaultLogo2
      // ) {
      //   const newhiringOrganization = {
      //     name: job.employer.name ? job.employer.name : hiringOrganization.name,
      //     sameAs: job.employer.website
      //       ? job.employer.website
      //       : hiringOrganization.sameAs,
      //     logo: defaultLogo2,
      //     address: job.jobPostingSchema.jobLocation.address,
      //   };
      //   job.jobPostingSchema.hiringOrganization = newhiringOrganization;

      //   job.save();
      //   console.log(`Job Employer Updated ${job._id}`);
      // }

      const employerDB = await db.Employer.findById(employer._id);
      if (employerDB.jobs.indexOf(job._id) == -1) {
        employerDB.jobs.push(job._id);
        employerDB.save();
        console.log(`Job Added To Employer`);
      }
    }
  });
}
// updateJobWithEmployeSchema();
async function test() {
  try {
    const jobsWithEmployer = await db.Job.find({})
      .where("employer")
      .ne(undefined)
      .populate("employer");
    const job = jobsWithEmployer[0];
    const employerDB = await db.Employer.findById(job.employer._id);
  } catch (err) {
    console.log(err);
  }
}

async function groupByEmployer() {
  db.Job.aggregate([
    {
      $sort: {
        date: -1,
      },
    },
    {
      $limit: 1000,
    },
    {
      $group: {
        _id: "$jobPostingWidget.employerName",
        jobs: { $push: "$$ROOT" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        count: -1,
      },
    },
  ])
    .exec()
    .then(function (results) {
      // Process results
      console.log(results);
    })
    .catch(function (err) {
      console.log(err);
      // Handle error
    });
}
async function removeNulledJobsFromEmployer() {
  const employers = await db.Employer.find({}).sort("-1").limit(100);

  employers.map((employer) => {
    employer.jobs.forEach(async (jobId) => {
      const jobDB = await db.Job.findById(jobId);

      if (jobDB == null) {
        employer.jobs.pull(jobId);
      } else {
        console.log(chalk.green(jobDB.id));
      }
    });
  });
}
// removeNulledJobsFromEmployer();
// updateJobWithEmployeSchema();
async function updateMetaWithIntro() {
  console.log("excecutig");
  const data = await db.Job.find({}).where("introduction.length > 0");
  console.log(data.length);
}

async function createEmployerSchema() {
  const jobs = await db.Job.find({});
  const img = await getFeaturedImage();

  jobs.forEach(async (job) => {
    if (job.employer) {
      return;
    }

    const { employerName, website } = job.jobPostingWidget;

    if (job.jobPostingWidget && employerName && website) {
      const checkIfExist = await db.Employer.findOne({
        name: employerName,
      });

      if (checkIfExist == null) {
        try {
          const employer = {
            name: employerName,
            website: website,
            logo: img,
          };
          await db.Employer.create(employer);
        } catch (err) {
          console.log(err);
        }
      } else {
        if (checkIfExist.jobs.indexOf(job._id) === -1) {
          checkIfExist.jobs.push(job._id);
          checkIfExist.save();
        }
        job.employer = checkIfExist._id;
        job.save();
      }
    }
  });
}
const createJob = async (job) => {
  try {
    const j = await db.Job.create(job);

    const jobToSend = await generateGPTData(j._id);
    return jobToSend;
  } catch (err) {
    console.log(err);
    return err;
  }
};
async function getFeaturedImage() {
  const img = await db.FeaturedImage.find({}).limit(1);
  if (Array.isArray(img) && img.length > 0 && img[0] && img[0].src) {
    return img[0].src;
  }
  return "";
}

const addNewJobToDB = async (job) => {
  const dbFeaturedImage = await getFeaturedImage();
  const old = "https://jobbank.ai/wp-content/uploads/2023/05/JobBank-AI.jpg";
  const { employerName, website } = job.jobPostingWidget;

  if (employerName) {
    const isEmployerExist = await db.Employer.findOne({ name: employerName });
    // if emoloyeexist then add the employe ref

    if (isEmployerExist) {
      const jobToPost = {
        ...job,
        employer: isEmployerExist._id,
        featuredImg:
          isEmployerExist.logo == old ? dbFeaturedImage : isEmployerExist.logo,
        jobPostingSchema: {
          ...job.jobPostingSchema,
          hiringOrganization: {
            sameAs: isEmployerExist.website,
            name: isEmployerExist.name,
            logo:
              isEmployerExist.logo == old
                ? dbFeaturedImage
                : isEmployerExist.logo,
          },
        },
      };

      isEmployerExist.address = {
        ...job.jobPostingSchema.jobLocation.address,
      };

      const createdJob = await createJob(jobToPost);
      isEmployerExist.jobs.push(createdJob._id);
      isEmployerExist.save();

      return jobToPost;
    } else {
      //create new employer
      const employer = {
        name: employerName,
        website: website,
        logo: dbFeaturedImage,
        address: {
          ...job.jobPostingSchema.jobLocation.address,
        },
      };
      const employerDB = await db.Employer.create(employer);
      const jobToPost = {
        ...job,
        employer: employerDB._id,
        jobPostingSchema: {
          ...job.jobPostingSchema,
          hiringOrganization: {
            sameAs: employer.website,
            name: employer.name,
            logo: employer.logo,
          },
        },
      };
      const createdJObDB = await createJob(jobToPost);

      return jobToPost;
    }
    // else create a employe if it has website
  } else {
    console.log(`No employer name was found`);
  }
};
async function generateGPTData(id, force = false) {
  const job = await db.Job.findOne({ _id: id });
  if (job) {
    try {
      if (job.introduction && job.introduction.length == 0) {
        const introduction = await generateIntroduction(job);
        if (introduction.data?.choices[0]?.text) {
          job.introduction = introduction.data?.choices[0]?.text;
          job.meta.description = introduction.data?.choices[0]?.text;
          console.log(`Added  job.introduction ${id}`);
        }
      }

      if (job.jobRequirement_old === undefined && typeof job.jobRequirement === 'string') {
        const keyValue = createKeyValuePair(cheerio.load(job.jobRequirement));

        const description = await jobRequrementGenerator(keyValue);
        const jobPostingDescHTML = cheerio.load(description, null, false);
        jobPostingDescHTML(".remove-for-description").remove();
        job.jobPostingSchema.description = jobPostingDescHTML.html();

        if (description.length > 0) {
          job.jobRequirement_old = job.jobRequirement;
          job.jobRequirement = formatter(description);
          console.log(`Added job.jobRequirement ${id}`);
        }
      } else {
        if (force == true) {
          const keyValue = createKeyValuePair(
            cheerio.load(job.jobRequirement_old)
          );
          const description = await jobRequrementGenerator(keyValue);

          if (description.length > 0) {
            const jobPostingDescHTML = cheerio.load(description, null, false);
            jobPostingDescHTML(".remove-for-description").remove();
            job.jobPostingSchema.description = jobPostingDescHTML.html();
            job.jobRequirement = formatter(description);
            console.log(
              `Added job.jobRequirement for jobs which were rescraped ${id}`
            );
            job.regenerated = true;
          }
        } else {
          console.log(
            job.jobRequirement_old.length,
            `Already have job.jobRequirement_old`
          );
        }
      }

      job.save();
      return job;
    } catch (err) {
      console.log(err);
    }
  }
}

(async () => {
  const job = await db.Job.findOne({ id: "45192965" });

 return
  if(job){
  
    const introduction = await generateIntroduction({
      
      jobTitle: capitalizeFirstLetter(job.jobTitle),
      jobLocation: job.jobPostingWidget.joblocation,
      LMIA: job.lmia?.includes("LMIA") ? "Yes" : "No",
      employerName: job.jobPostingWidget.employerName,
      shift: job.shift,
      jobType: job.jobPostingWidget.jobType
        ? job.jobPostingWidget.jobType.replace("employmentFull", "employment or Full")
        : "",
      isRemote: false,
    });
    console.log({introduction})


  }else{
    console.log('Job not in DB')
  }
 
})();
// Function to remove the howToApply field from all records
// async function removeAllHowToApply() {
//   try {
//     const result = await db.Job.updateMany({}, { $unset: { howToApply: 1 } });
//     return result;
//   } catch (error) {
//     console.error("Error removing howToApply field:", error);
//     throw error;
//   }
// }

// Example usage
// removeAllHowToApply()
//   .then((result) => {
//     console.log("Number of records modified:", result.nModified);
//   })
//   .catch((error) => {
//     console.error("Error:", error);
//   });
async function bulkCapitalizeJobTitle() {
  try {
    const regex = /^[^A-Z]/; // Regex to match non-capitalized first letter

    const records = await db.Job.find({
      jobTitle: { $regex: regex },
    }).select("jobTitle");

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      console.log(chalk.green(record.jobTitle));

      record.jobTitle = capitalizeFirstLetter(record.jobTitle);

      await record.save();
    }

    return records.length;
  } catch (error) {
    console.error(chalk.red("Error capitalizing jobTitle:"), error);
    throw error;
  }
}

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Example usage
// bulkCapitalizeJobTitle()
//   .then((count) => {
//     console.log(chalk.green(`Capitalized jobTitle for ${count} records.`));
//   })
//   .catch((error) => {
//     console.error(chalk.red("Error:"), error);
//   });

async function getAllTheUndefinedOrNullOrOldJobRequirement() {
  try {
    const result = await db.Job.find({
      jobRequirement_old: { $in: [undefined, null] },
    }).limit(200);
    return result;
  } catch (error) {
    console.error("Error while fetching records:", error);
    throw error;
  }
}
async function main() {
  const result = await db.Job.countDocuments({
    jobRequirement_old: { $in: [undefined, null] },
  });

  console.log(
    chalk.bgGray.yellowBright.bold(`JOBS THAT ARE NOT THERE ${result}`)
  );
}

async function updateNullJobRequirement() {
  return null
  const jobs = await getAllTheUndefinedOrNullOrOldJobRequirement();

  if (jobs.length > 0) {
    jobs.forEach(async (job) => {
      try {
        await generateGPTData(job._id);
        console.log(`Generating Requirement For job id => ${job.id} `);
      } catch (err) {
        console.log(err, `updateNullJobRequirement`);
      }
    });
  } else {
    console.log(
      chalk.yellow("Requirements for all jobs are already generated")
    );
  }
}

updateNullJobRequirement();
async function deleteRecordsWithUndefinedOrNullOrOldJobRequirement() {
  try {
    const result = await db.Job.deleteMany({
      jobRequirement_old: { $in: [undefined, null] },
    });
    return result;
  } catch (error) {
    console.error("Error deleting records:", error);
    throw error;
  }
}
// deleteRecordsWithUndefinedOrNullOrOldJobRequirement();

async function removeById(id) {
  const removed = await db.Job.findOneAndDelete({ id: id });

  return removed;
}
async function cleaner() {
  const jobs = await db.Job.find({ slug: null });
  await db.Job.findByIdAndDelete(jobs[0]?._id);
}

// main();
async function searchJobsByTitleOrEmployer(searchQuery, page = 1, pageSize = 10) {
  const regexQuery = {
    $or: [
      { jobTitle: { $regex: searchQuery, $options: "i" } }, // Case-insensitive regex for job title
      { "jobPostingWidget.employerName": { $regex: searchQuery, $options: "i" } }, // Case-insensitive regex for employer name
    ],
  };

  const options = {
    page,
    limit: pageSize,
    
  };

  try {
    const result = await db.Job.paginate(regexQuery, options);

    return result;
  } catch (err) {
    console.error("Error searching and paginating jobs:", err);
    throw err;
  }
}

async function getJobsByType(employmentType, page = 1, pageSize = 10){
  const options = {
    page,
    limit: pageSize,
     
    sort: { date: -1 }, // Sort by date in descending order

  };

  try {
    const result = await db.Job.paginate(
      { "jobPostingSchema.employmentType": [employmentType] },
      options
    );

    return  result
  } catch (err) {
    console.error("Error fetching paginated jobs:", err);
    throw err;
  }
}
 
async function getLMIAJobs(page=1,pageSize=10){
  const options = {
    page,
    limit: pageSize,
    sort: { date: -1 }, // Sort by date in descending order

  };

  try {
    const result = await db.Job.paginate(
      { "jobPostingWidget.LMIA": "Yes"},
      options
    );

    return result
  } catch (err) {
    console.error("Error fetching paginated jobs:", err);
    throw err;
  }
}
 
async function fetchJobBankJobs(url) {
  // await db.Job.deleteMany({});
  const links = await getAllLinks(url);

  if (!links) {
    console.log("No Links found from " + url);
    return;
  }
  
  links.map(async (id) => {
    try {
      const checkIfExist = await db.Job.find({ id: id });

      if (checkIfExist.length === 0) {
        let j = await getJobSchemaById(id);
        
        if (j&&j.jobPostingWidget == undefined) {
          return;
        }
        const employer = await db.Employer.findOne({
          name: j.jobPostingWidget.employerName,
        });
        if (employer === null) {
          const employerDetails = {
            name: j.jobPostingSchema.hiringOrganization.name,
            website: j.jobPostingSchema.hiringOrganization.sameAs
              ? j.jobPostingSchema.hiringOrganization.sameAs
              : "",
            logo: j.jobPostingSchema.hiringOrganization.logo,
            address: j.jobPostingSchema.jobLocation.address,
          };
          try {
            const employerSaved = await db.Employer.create(employerDetails);
            j.employer = employerSaved._id;
            console.log(chalk.red("Employer was not in database"));
          } catch (err) {
            console.log(chalk.red(err));
          }
        } else {
          j.employer = employer._id;
          j.featuredImg = employer.logo;
          j.jobPostingSchema.hiringOrganization.logo = employer.logo;

          console.log(
            chalk.green(`${employer.name} is in database`, employer._id)
          );
        }

        if (Object.keys(j).length > 0) {
          db.Job.create(j)
            .then(async (r) => {
              await updateEmployerWithJobId(r.employer, r._id);
              await generateGPTData(r._id);
              console.log(`Added ${j.jobTitle} in database with _id ${r._id}`);
            })
            .catch((err) => console.log(`Error While Creating `, err));
        } else {
          console.log(chalk.red(`Not a valid job `));
        }
      } else {
        console.log(chalk.yellow("Job is already in database"));
      }
  await updateOldFeaturedImage()

    } catch (err) {
      console.log({ err });
      console.log("Error while creating job schema ", id);
    }
  });
}
function extractIDFromURL(url) {
  // Extract the ID using regular expression
  const idRegex = /(?<=-)[a-f0-9]{32}/;
  const idMatch = url.match(idRegex);

  if (idMatch) {
    const jobID = idMatch[0];
    return jobID;
  } else {
    return "";
  }
}
async function updateFeaturedImage() {
  db.Job.find({})
    .then((jobs) => {
      jobs.forEach((job) => {
        // if (job.featuredImg === undefined ) {
        //   job.featuredImg = defaultLogo;
        //   job.save();
        //   console.log("updated");
        // }
        // console.log(job.jobPostingSchema.image);
        if (job.jobPostingSchema.image) {
          // job.jobPostingSchema.image["@id"] = console.log(
          //   job.jobPostingSchema.image["@id"]
          // );
        }

        // if (job.jobPostingSchema.image["@id"] === prevImg) {
        //   console.log("Found : ");
        //   job.jobPostingSchema.hiringOrganization.logo = defaultLogo;
        //   job.jobPostingSchema.image["@id"] = defaultLogo;

        //   job.save();
        // }
      });
    })
    .catch((err) => {
      console.log(err);
    });
}
// updateFeaturedImage();

async function updateEmployerImg() {
  db.Employer.find({}).then((employers) => {
    employers.forEach((employer) => {
      if (employer.logo !== defaultLogo) {
        employer.logo = defaultLogo;
        employer.save();
        console.log("Updated");
      }
    });
  });
}
// updateEmployerImg();
async function updateMetaDescription() {
  db.Job.find({}).then((jobs) => {
    jobs.forEach((job, i) => {
      if (
        job.introduction.length > 0 &&
        job.meta.description != job.introduction
      ) {
        job.meta.description = job.introduction;
        job.save();
      }

      if (jobs.length === i + 1) {
        console.log(`Done`);
      }
    });
  });
}
async function updateJobDescription() {
  db.Job.find({}).then((jobs) => {
    jobs.forEach((job, i) => {
      if (job.jobRequirement_old && job.jobRequirement) {
        job.jobRequirement = formatter(job.jobRequirement);
        job.save();
      }
      if (jobs.length === i + 1) {
        console.log(`Done`);
      }
    });
  });
}
async function updateEmployerWithJobId(employerID, jobID) {
  try {
    const employer = await db.Employer.findOne({ _id: employerID });

    if (employer) {
      employer.jobs.push(jobID);
      employer.save();
    }
  } catch (err) {
    console.log(err);
  }
}
async function updateMetaTitle() {
  db.Job.find({}).then((jobs) => {
    jobs.forEach((job, index) => {
      let t = 0;
      if (job.meta.title.includes("Job Bank AI")) {
        console.log(t);
        t++;
      }
    });
  });
}
// updateMetaTitle();
// updateJobDescription();
// updateMetaDescription();
// updateMetaTitle();
// updateEmployerImg();
// updateFeaturedImage();
 
module.exports = {
  getAllLinks,
  removeById,
  createEmployerSchema,
  fetchJobBankJobs,
  addNewJobToDB,
  updateJobWithEmployeSchema,
  updateMetaWithIntro,
  generateGPTData,
  formatter,
  updateNullJobRequirement,
  getAllTheUndefinedOrNullOrOldJobRequirement,
  extractIDFromURL,
  getLMIAJobs,getJobsByType,
  searchJobsByTitleOrEmployer
};
