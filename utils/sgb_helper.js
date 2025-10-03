const db = require("../models");
const chalk = require("chalk");

async function addJobToSGBDatabase(jobDetails) {
  try {
    const savedJob = await db.SGJob.create(jobDetails);
    console.log(chalk.green(`Job ${jobDetails.jobTitle} is saved To Database`));
  } catch (err) {
    console.log(chalk.red({ err }));
  }
}
async function removeSGBJobById(id) {
  const removed = await db.SGJob.findOneAndDelete({ id: id });

  return removed;
}

module.exports = {
  addJobToSGBDatabase,
  removeSGBJobById,
};
