require("dotenv").config;
var cron = require("node-cron");
const {
  createEmployerSchema,
  fetchJobBankJobs,
  updateNullJobRequirement,
} = require("./helper");
const {
  updateEmployerWithAddress,
  rescrapeAndRegenerate,
  updateOldFeaturedImage,
  findJobsWithLogo,
  init,
} = require("./DBformatter");
 

(async function () {
 
  // await updateNullJobRequirement();
   if (process.env.NODE_ENV !== "development") {
    
    const schedulePerMin = "*/1 * * * *";
    cron.schedule(schedulePerMin, async () => {
      await updateEmployerWithAddress();
    });

    cron.schedule("34 * * * *", async () => {
      await fetchJobBankJobs(
        "https://www.jobbank.gc.ca/jobsearch/?page=1&sort=D"
      );
      await fetchJobBankJobs(
        "https://www.jobbank.gc.ca/jobsearch/jobsearch?sort=M&fsrc=16"
      );
      await createEmployerSchema();
    });

    // fetchJobBankJobs("https://www.jobbank.gc.ca/jobsearch/?page=1&sort=D");
    // cron.schedule("40 * * * *", async () => {
    //   await updateNullJobRequirement();
    // });
    // cron.schedule("50 * * * *", async () => {
    //   await updateNullJobRequirement();
    // });
    cron.schedule("* * * * *", async () => {
      await rescrapeAndRegenerate(10);
      await updateNullJobRequirement();
      await updateOldFeaturedImage();
     await findJobsWithLogo()
    });
    // https://www.jobbank.gc.ca/jobsearch/jobsearch?sort=D&fsrc=16
    cron.schedule("*/15 * * * *", async () => {
      await fetchJobBankJobs(
        `https://www.jobbank.gc.ca/jobsearch/jobsearch?sort=D&fsrc=16`
      );
      await fetchJobBankJobs(
        `https://www.jobbank.gc.ca/jobsearch/jobsearch?page=1&sort=M&fsrc=16`
      );
      await fetchJobBankJobs(
        `https://www.jobbank.gc.ca/jobsearch/jobsearch?page=2&sort=M&fsrc=16`
      );

      await fetchJobBankJobs(
        `https://www.jobbank.gc.ca/jobsearch/jobsearch?page=3&sort=M&fsrc=16`
      );
      await fetchJobBankJobs(
        `https://www.jobbank.gc.ca/jobsearch/jobsearch?page=4&sort=M&fsrc=16`
      );

      await fetchJobBankJobs(
        `https://www.jobbank.gc.ca/jobsearch/jobsearch?fsrc=32`
      );
      await updateOldFeaturedImage();
    });
  }
  // cron.schedule("* * * * *", async () => {
  //   await updateNullJobRequirement();
  //   await init()
  // });

  // await updateOldFeaturedImage();

})();
