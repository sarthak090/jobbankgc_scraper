const chalk = require("chalk");
const db = require("../models/");
const { generateIntroduction } = require("./sentences");
const { getJobSchemaById } = require("./scraper");
const cheerio = require("cheerio");
const { generateGPTData, removeById } = require("./helper");
var instructionsArray = [
  "Submit your application using any of the given options.",
  "Apply through the given options.",
  "Please submit your application through the provided channels or options.",
  "Please utilize the provided options to submit your application.",
  "Use the provided options and submit your application if you are interested.",
  "Kindly use the given options to submit your application if you are interested.",
  "Please utilize the provided options to submit your application if you wish to apply.",
  "To submit your application, please use the given options if you are interested in applying.",
  "If you have a keen interest in applying, kindly utilize the provided alternatives to submit your application.",
  "If you are enthusiastic about applying, please use the available alternatives to submit your application.",
];

function getRandomInstruction() {
  var randomIndex = Math.floor(Math.random() * instructionsArray.length);
  return instructionsArray[randomIndex];
}

async function UpdateHowToApply() {
  //   await db.Job.updateMany({}, { $unset: { howToApply: 1 } })
  const htmlTagRegex = /<[^>]+>/g;
  const jobs = await db.Job.find({}).sort("-_id").select("howToApply");

  jobs.forEach((job, index) => {
    job.howToApply = getRandomInstruction();
    job.save();

    if (index + 1 == jobs.length) {
      console.log(chalk.red(`Updated All`));
    }
  });
}
async function UpdateJobTitle() {
  //   await db.Job.updateMany({}, { $unset: { howToApply: 1 } })

  const jobs = await db.Job.find({})
    .where("jobPostingWidget.LMIA")
    .equals("No")
    .limit(1);
  console.log({ jobs });
}

async function formattedDescription() {
  const searchString = "^,jobcategory";

  const jobs = await db.Job.find({
    ["meta.description"]: { $regex: searchString, $options: "i" },
  });

  jobs.forEach((job) => {
    const description = job.meta.description.replace(/,jobcategory.*\n/, "");

    console.log(chalk.yellowBright(description));
  });
}
async function formatIntroduction() {
  const searchString = "^,jobcategory";

  const jobs = await db.Job.find({
    introduction: { $regex: searchString, $options: "i" },
  });

  jobs.forEach((job) => {
    const introduction = job.introduction.replace(/,jobCategory : .*?\n/, "");
    // const description = job.meta.description.replace(/,jobCategory : .*?\n/, '');
    job.introduction = introduction;
    job.save();
    console.log(chalk.yellowBright(job.id, introduction));
  });
}

async function updateSchema() {
  const jobs = await db.Job.find({
    "jobPostingSchema.baseSalary.value.@type": { $exists: false },
  });

  jobs.forEach(async (job, i) => {
    job.jobPostingSchema.baseSalary.value["@type"] = "QuantitativeValue";
    await job.save();

    if (jobs.length === i + 1) {
      console.log(chalk.greenBright("Completed"));
    }
  });
}
async function updateFeaturedImgOfJob() {
  const oldImage =
    "https://jobbank.ai/wp-content/uploads/2023/05/jb-logo-2.png";
  const newImage =
    "https://jobbank.ai/wp-content/uploads/2023/05/JobBank-AI.jpg";
  const jobs = await db.Job.find({
    featuredImg: oldImage,
  })

    .limit(300)
    .select("featuredImg id jobPostingSchema");

  jobs.forEach(async (job) => {
    job.featuredImg = newImage;
    job.jobPostingSchema.hiringOrganization.logo = newImage;
    job.save();
    console.log(`Image of job updated ${job.id}`);
  });
}
// updateFeaturedImgOfJob()

async function findAllJobWithoutEmployerAndAddEmployerTODatabas() {
  const jobsWithEmployer = await db.Job.find({})
    .where("employer")
    .equals(undefined)
    .limit(200);

  jobsWithEmployer.forEach(async (job, i) => {
    if (i + 1 === jobsWithEmployer.length) {
      console.log(chalk.bgRedBright.yellow("All Jobs Fetched and DOne"));
      return;
    }
    const employerDetails = {
      name: job.jobPostingSchema.hiringOrganization.name,
      website: job.jobPostingSchema.hiringOrganization.sameAs
        ? job.jobPostingSchema.hiringOrganization.sameAs
        : "",
      logo: job.jobPostingSchema.hiringOrganization.logo,
      address: job.jobPostingSchema.jobLocation.address,
      jobs: [job._id],
    };
    try {
      const employer = await db.Employer.findOne({
        name: employerDetails.name,
      });
      if (employer === null) {
        const createdEmployers = await db.Employer.create(employerDetails);
        console.log(createdEmployers._id);
      } else {
        if (employer.address.streetAddress == undefined) {
          console.log(
            chalk.bgYellow("Address is not in database"),
            employer._id
          );

          employer.address = job.jobPostingSchema.jobLocation.address;

          employer.save();
        }
        const isTheJobIsEmployer = employer.jobs.indexOf(job._id) > -1;
        if (isTheJobIsEmployer) {
          console.log(
            chalk.yellow(
              `Employer is in database but not refernced to the job`,
              employer._id
            )
          );
          job.employer = employer._id;
          job.save();
        } else {
          employer.jobs.push(job._id);
          await employer.save();
          console.log(
            chalk.redBright("Employer exist add job it to it "),
            employer._id
          );
        }
      }
    } catch (err) {
      console.log({ err });
    }
  });
}
async function updateEmployerWithAddress() {
  const employers = await db.Employer.find({})
    .where("address.streetAddress")
    .equals(undefined)
    .populate("jobs");

  const filteredEmployers = employers.filter(
    (employer) => employer.jobs !== null && employer.jobs.length > 0
  );

  filteredEmployers.forEach((employer) => {
    if (employer.jobs && employer.jobs.length > 0) {
      const firstJob = employer.jobs[0];
      const address = firstJob.jobPostingSchema.jobLocation.address;
      employer.address = address;
      employer.save();
      console.log(
        chalk.green(
          `Added Address to ${employer.name} with ID => ${employer._id}`
        )
      );
    }
  });
}

async function updateJobsFeaturedImgs() {
  const logo1 = "https://jobbank.ai/wp-content/uploads/2023/05/jb-logo-2.png";
  const logo2 = "https://jobbank.ai/wp-content/uploads/2023/05/JobBank-AI.jpg";

  const employers = await db.Employer.find({
    $and: [
      {
        logo: {
          $ne: "https://jobbank.ai/wp-content/uploads/2023/05/jb-logo-2.png",
        },
      },
      {
        logo: {
          $ne: "https://jobbank.ai/wp-content/uploads/2023/05/JobBank-AI.jpg",
        },
      },
      { jobs: { $exists: true, $ne: [] } },
    ],
  }).exec();
  employers.forEach(async (employer) => {
    const jobs = await db.Job.find({ employer: employer._id });
    jobs.forEach(async (job) => {
      if (job.featuredImg == logo1 || job.featuredImg == logo2) {
        job.featuredImg = employer.logo;
        job.jobPostingSchema.hiringOrganization.logo = employer.logo;
        await job.save();
        console.log(`updated logo for ${job.jobTitle} ${job.id}`);
      }
      // job.featuredImg=employer.logo
      // job.jobPostingSchema.hiringOrganization.logo=employer.logo
      // await job.save()
    });
  });
}

async function getJobsWithoutIntroduction() {
  const jobs = await db.Job.find({
    introduction: { $regex: "\\bemploymentPart\\b", $options: "i" },
  }).limit(1);

  jobs.forEach(async (job, i) => {
    // const introduction = await generateIntroduction({
    //   jobTitle: job.jobTitle,
    //   jobLocation: job.jobPostingWidget.joblocation.replace(
    //     "employmentPart ",
    //     "employment Part "
    //   ),
    //   LMIA: job.jobPostingWidget.LMIA,
    //   employerName: job.jobPostingWidget.employerName,
    //   shift: job.jobPostingWidget.shift,
    //   jobType: job.jobPostingWidget.jobType,
    //   isRemoteJob: job.jobRequirement_old?.includes("Remote work available"),
    // });

    job.introduction = job.introduction.replace(
      "employmentPart ",
      "employment Part "
    );
    console.log(job.introduction);
    // await job.save();
    if (i + 1 == jobs.length) {
      console.log(chalk.bgRed("All Jobs is Updated"));
    }
    console.log(`Job named ${job.jobTitle} is updated ${job.id}`);
  });
}
async function getEmployerWithDifferentLocation() {
  const jobs = await db.Job.find({})
    .where("employer.address.addressRegion")
    .ne("jobPostingSchema.jobLocation.address.addressRegion")
    .limit(4);

  return jobs;
}

// getJobsWithoutIntroduction();
// updateJobsFeaturedImgs();

async function updateEmployerWithAddresses() {
  // const employersCount = await db.Employer.countDocuments({
  //   addresses: { $exists: false },
  //   address: { $exists: true, $ne: {} },
  // });
  // console.log(employersCount);
  // return;

  const employers = await db.Employer.find({
    addresses: { $exists: false },
    address: { $exists: true, $ne: {} },
  }).limit(1000);
  if (employers.length < 1000) {
    console.log("Less No of employers left");
  }
  employers.forEach((employer, i) => {
    employer.addresses.push(employer.address);
    employer.save();
    // console.log(
    //   `Update Employer ${employer.name} addresses => ` + employer._id
    // );
    if (i + 1 === employers.length) {
      console.log(chalk.redBright("All Updated"));
    }
  });
}
// updateEmployerWithAddresses();
function containsHtmlTags(string) {
  const pattern = /<.*?>/; // Regular expression pattern to match HTML tags
  return pattern.test(string);
}
async function rescrapeAndRegenerate(limit = 1) {
  const oldJobs = await db.Job.find({ regenerated: undefined }).limit(limit);
  if (oldJobs.length < limit) {
    console.log(chalk.bgRed("All Jobs are updated"));
  }

  for (const job of oldJobs) {
    try {
      const scrapedData = await getJobSchemaById(job.id);

      const updateData = {
        "jobPostingWidget.LMIA": scrapedData.jobPostingWidget.LMIA,
        requiredDocuments: scrapedData.jobPostingWidget.requiredDocuments,
        howToApplySchema: scrapedData.howToApplySchema,
        "jobPostingWidget.jobType": scrapedData.jobPostingWidget.jobType,
      };

      if (!containsHtmlTags(job.jobRequirement)) {
        updateData.jobRequirement = "";
      } else {
        console.log("HTML DATA WAS THERE ALREADY");
        updateData.regenerated = true;
      }

      console.log(
        `Job title ${job.jobTitle} is rescraped and the sentence will be updated ${job.id}`
      );

      const existingJob = await db.Job.findOne({ _id: job._id });
      if (existingJob) {
        await db.Job.updateOne({ _id: job._id }, { $set: updateData });
        await generateGPTData(job._id, true);
      } else {
        console.log(`Job with id ${job._id} not found. Skipping update.`);
      }
    } catch (err) {
      console.log(
        `Error while rescraping ${job.id}. Removing it from the database.`
      );
      await removeById(job.id);
    }
  }

  // jobrequirement
  // introduction
  // description
  // LMIA
  // requiredDocuments
  // job-type
}

async function getRegeneratedDataWithZeroLLength() {
  const jobs = await db.Job.find({});
}

// jobrequirement
// introduction
// description
// LMIA
// requiredDocuments
// job-type

async function updateZeroLengthDescription() {
  const oldJobs = await db.Job.find({
    $expr: { $eq: [{ $strLenCP: "$jobPostingSchema.description" }, 0] },
  });
  oldJobs.forEach((job) => {
    if (job.jobRequirement_old) {
      const descriptionHTML = cheerio.load(job.jobRequirement, null, false);
      descriptionHTML(".remove-for-description").remove();
      job.jobPostingSchema.description = descriptionHTML.html();
      job.save();
      console.log(`Updated `, job.id);
    }
  });
}

async function findJobsWithLogo() {
  try {
    const jobs = await db.Job.find({
      "jobPostingSchema.hiringOrganization.logo":
        "https://jobbank.ai/wp-content/uploads/2023/05/JobBank-AI.jpg",
    });
    const img=await db.FeaturedImage.find({}).limit(1)
    console.log(jobs.length,' posts with old jobbank featured Image')
    jobs.forEach((job)=>{
      job.jobPostingSchema.hiringOrganization.logo=img[0].src
      // console.log(job.jobPostingSchema.hiringOrganization.logo)
      job.save()
    })
    // Do something with the found jobs
  } catch (error) {
    console.error(error);
    // Handle error
  }
}

async function findJobsWithTitle() {
  try {
    const filter = {
      "meta.title": { $regex: "JobBank AI", $options: "i" },
    };

    const jobs = await db.Job.find(filter).select('meta');
    const meta= await db.MetaTitle.find({}).limit(1)
    const meta_title= meta[0].title
    console.log(jobs,' posts with JobBank AI in meta title');
    jobs.forEach((job)=>{

      job.meta.title =job.meta.title.replace('JobBank AI',meta_title)
      job.save()
    })

    // Do something with the found jobs
  } catch (error) {
    console.error(error);
    // Handle error
  }
}
// findJobsWithTitle()

async function updateTitleInJobs(oldMetaTitle,newMetaTitle) {
  console.log({oldMetaTitle,newMetaTitle})
  try {
    const filter = {
      "meta.title": { $regex: oldMetaTitle, $options: "i" },
    };

    const update = [
      {
        $set: {
          "meta.title": {
            $replaceOne: {
              input: "$meta.title",
              find: oldMetaTitle,
              replacement: newMetaTitle,
            },
          },
        },
      },
    ];

    const result = await db.Job.updateMany(filter, update);

    console.log(`${result.modifiedCount} jobs meta title are updated`);
    return result
  } catch (error) {
    console.error(error);
    // Handle error
  }
}

// Call the async function to execute the update
async function updateMetaTitle(){
  const meta_titles=await db.MetaTitle.find()
  const oldMeta=meta_titles[1].title
  const newMeta=meta_titles[0].title
  console.log({oldMeta,newMeta})
  updateTitleInJobs('JobBank AI',newMeta)
}
 
async function updateOldFeaturedImage() {
  try {
    const newFeaturedImage = await db.FeaturedImage.find({}).limit(1); // Provide the new featured image URL
//https://jobbank.ai/wp-content/uploads/2023/05/JobBank-AI.jpg
    const featureImage = newFeaturedImage[0]?.src;
    const oldLogoValue =
      "https://jobbank.ai/wp-content/uploads/2023/05/JobBank-AI.jpg";
    const filter = {
      featuredImg: oldLogoValue,
    };
    // Update all jobs with the new featured image
    const updateResult = await db.Job.updateMany(filter, {
      $set: { featuredImg: featureImage },
    });
    await updateEmployerLogos(oldLogoValue, featureImage);

    console.log({
      message: `${updateResult.modifiedCount} jobs updated with the new featured image. `,
    });
  } catch (err) {
    console.log(err);
  }
}
async function updateJobsWithLogo() {
  try {
    const filter = {
      "jobPostingSchema.hiringOrganization.logo":
        "https://jobbank.ai/wp-content/uploads/2023/05/JobBank-AI.jpg",
    };

    const update = {
      $set: {
        "jobPostingSchema.hiringOrganization.logo":
          "https://canadain.org/wp-content/uploads/c/CanadaIn.png",
      },
    };

    const result = await db.Job.updateMany(filter, update);

    console.log(`${result.modifiedCount} jobs updated`);
  } catch (error) {
    console.error(error);
    // Handle error
  }
}

// Call the async function to execute the update
// updateJobsWithLogo();

// Call the async function to execute the query
// findJobsWithLogo();
const findEmployersByLogo = async (logoValue) => {
  try {
    const employersWithLogo = await db.Employer.countDocuments({
      logo: logoValue,
    });

    return employersWithLogo;
  } catch (error) {
    throw new Error("An error occurred while fetching employers.");
  }
};

// Example usage
const logoValueToSearch =
  "https://jobbank.ai/wp-content/uploads/2023/05/JobBank-AI.jpg";
// findEmployersByLogo(logoValueToSearch)
//   .then((employers) => {
//     console.log("Employers with matching logo:", employers);
//   })
//   .catch((error) => {
//     console.error(error.message);
//   });

const updateEmployerLogos = async (oldLogoValue, newLogoURL) => {
  
  try {
    const result = await db.Employer.updateMany(
      { logo: oldLogoValue },
      { $set: { logo: newLogoURL } }
    );
    console.log(result.modifiedCount, " Logo Updated");
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("An error occurred while updating employer logos.");
  }
};



// updateZeroLengthDescription();

async function findSentencesWithOptionsWithZeroOptions() {
  try {
    const results = await db.SentencesOptions.find({ 'sentences.options': { $size: 0 } });
    console.log('SentencesWithOptions documents with sentences having zero options:', results);
  } catch (err) {
    console.error('Error:', err);
  }
}

// findSentencesWithOptionsWithZeroOptions();
async function init(){

updateOldFeaturedImage()
updateMetaTitle()
findJobsWithLogo()
const oldLogoValue =
  "https://jobbank.ai/wp-content/uploads/2023/05/JobBank-AI.jpg";
const newLogoURL = "https://canadain.org/wp-content/uploads/c/CanadaIn.png";

updateEmployerLogos(oldLogoValue, newLogoURL)
  .then((updateResult) => {
    console.log("Updated employers:", updateResult);
  })
  .catch((error) => {
    console.error(error.message);
  });
}

module.exports = {
  updateEmployerWithAddress,
  getEmployerWithDifferentLocation,
  rescrapeAndRegenerate,
  updateOldFeaturedImage,
  findJobsWithLogo,
  updateTitleInJobs,
  // init
};

// findAllJobWithoutEmployerAndAddEmployerTODatabas();
// async function addLoactionToEmployer(){

// }
// updateSchema();
// formatIntroduction();
// formattedDescription();

// UpdateJobTitle();
// UpdateHowToApply();
