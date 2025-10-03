const { default: axios } = require("axios");
const db = require("../models/");
const cheerio = require("cheerio");
var cron = require("node-cron");
const { generateIntroduction } = require("./sentences");

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
    const jobs = await db.Job.find({
      id: { $in: numericIDs },
      "jobPostingWidget.LMIA": "No",
    }).lean();

    const existingIDs = jobs.map((job) => job.id);
    // console.log(existingIDs);
    // const nonExistingIDs = numericIDs.filter((id) => !existingIDs.includes(id));
    return existingIDs;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
async function LMIAJobUpdate(page = 10) {
  // fetch the directory link and check if that job exist in our db if exist cheeck there LMIA Status and Change is to YES
  const LMIAurl = `https://www.jobbank.gc.ca/jobsearch/jobsearch?page=3&sort=D&fsrc=32`;
  const urls = [page, page + 1, page + 2, page + 3].map(
    (n) =>
      `https://www.jobbank.gc.ca/jobsearch/jobsearch?page=${n}&sort=D&fsrc=32`
  );

  urls.forEach(async (url) => {
    const links = await getAllLinks(url);
    if (links.length > 0) {
      console.log("Updating LMIA JOBS ...");
    }
    links.forEach(async (id) => {
      await updateLMIAbyId(id)

    });
  });
}

async function updateLMIAbyId(id,force=false){
 
  const job = await db.Job.findOne({ id });
  if(force){
    if (job ) {
      job.jobPostingWidget.LMIA = "Yes";
   
  
      const introduction = await generateIntroduction({
        jobTitle: job.jobTitle,
        jobLocation: job.jobPostingWidget.joblocation,
        LMIA: "Yes",
        employerName: job.jobPostingWidget.employerName,
        shift: job.jobPostingWidget.shift,
        jobType: job.jobPostingWidget.jobType
          ? job.jobPostingWidget.jobType.replace("employmentFull", "employment or Full")
          : "",
        isRemote: false,
      });
      job.introduction=introduction
      job.jobTitle=  job.jobTitle +" | LMIA approved "
      console.log(job.id)

    job.save();
    }
  }else{
    job.jobPostingWidget.LMIA = "Yes";
 

    const introduction = await generateIntroduction({
      jobTitle: job.jobTitle,
      jobLocation: job.jobPostingWidget.joblocation,
      LMIA: "Yes",
      employerName: job.jobPostingWidget.employerName,
      shift: job.jobPostingWidget.shift,
      jobType: job.jobPostingWidget.jobType
        ? job.jobPostingWidget.jobType.replace("employmentFull", "employment or Full")
        : "",
      isRemote: false,
    });
    job.introduction=introduction
    job.jobTitle=  job.jobTitle +" | LMIA approved "
    // console.log(job)
    job.save();
  }
}
// (async()=>{
//  const lmiaJobs= await db.Job.find({"jobPostingWidget.LMIA":"Yes"})
 
// lmiaJobs.forEach(async(job)=>await (updateLMIAbyId(job.id,true)))
// })()
cron.schedule("* * * * *", async () => {
  await LMIAJobUpdate(1);
});
module.exports={
  updateLMIAbyId
}
