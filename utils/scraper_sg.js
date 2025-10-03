const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const { v4: uuidv4 } = require("uuid");

const slugify = require("slugify");
// const url = `https://www.mycareersfuture.gov.sg/job/information-technology/java-developer-spvl-scientec-consulting-ad665cbd40663500614788f4929b601f?source=MCF&event=Search`;

async function sgbFetchById(url) {
  if (!url) {
    console.log("No URL");
    return;
  }
  const browser = await puppeteer.launch({
    // executablePath: "/usr/bin/chromium-browser",
    args: ["--no-sandbox"],
    headless: "new",
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36"
  );

  await page.goto(url, {
    networkIdleTimeout: 5000,
    waitUntil: "networkidle0",
    timeout: 3000000,
  });

  await page.waitForSelector("h1", { timeout: 800000 });
  const data = await page.evaluate(() => document.querySelector("*").outerHTML);

  const t = await getJobSchemaById(url, data);

  await browser.close();
  return t;
}
sgbFetchById();

async function getJobSchemaById(id, htmlData) {
  const $ = cheerio.load(htmlData);

  const jobTitle = $("h1").text().trim();
  const joblocation = $("#address").text();

  const jobType = $("#employment_type").text();
  const experienceRequirements = $("#min_experience").text();
  const salary = $('[data-testid="salary-info"]').text().trim();
  const description = $("#job_description").html();
  const hiringOrganization = $('[data-testid="company-hire-info"]')
    .text()
    .trim();
  var jobSchema = JSON.parse($('script[type="application/ld+json"]').html());
  if (jobSchema && jobSchema.description) {
    jobSchema.description = "";
  }
  const metaTitle = `Hiring: ${jobTitle} | ${joblocation} - JobBank AI`;
  const Htmldescription = description?.replace(/\s\s+/g, " ");

  const jobDetails = {
    jobTitle: capitalizeFirstLetter(jobTitle),
    id: extractIDFromURL(id),
    featuredImg: `https://jobbank.ai/wp-content/uploads/2023/05/JobBank-AI.jpg`,
    jobPostingWidget: {
      employerName: hiringOrganization,
      // website: hiringOrganizationLink,
      // vacancy,
      salary: salary ? salary.replace("HOUR", "") : "",
      jobType: jobType
        ? jobType.replace("employmentFull", "employment Full")
        : "",
      // shift,
      joblocation,
    },
    requiredDocuments: {
      referenceNumber: extractReferenceNumber(Htmldescription),
    },
    meta: {
      id: extractIDFromURL(id),

      title: metaTitle,
      slug: slugify(jobTitle.toLowerCase() + "-" + extractIDFromURL(id), {
        replacement: "-",
        remove: /[*+~.()'"!:@]/g,
        lower: true,
      }),
      description: "",
    },
    introduction: "",
    howToApply: selectRandomSentence(),
    howToApplySchema: {
      applyOnline: `${removeQueryParamsFromURL(id)}/apply`,
      emailToApply: extractEmail(Htmldescription),
    },
    jobRequirement: description?.replace(/\s\s+/g, " "),
    slug: slugify(jobTitle.toLowerCase() + "-" + extractIDFromURL(id), {
      replacement: "-",
      remove: /[*+~.()'"!:@]/g,
      lower: true,
    }),
    jobPostingSchema: jobSchema,
  };
  if (!salary || salary.length == 0) {
    return {};
  }
  return jobDetails;
}
function extractEmail(htmlString) {
  // Extract email using regular expression
  const emailRegex = /([\w.-]+@[\w.-]+\.\w+)/;
  const emailMatch = htmlString.match(emailRegex);
  const email = emailMatch ? emailMatch[0] : "";

  // Extract job ID using regular expression

  return email;
}

function extractReferenceNumber(htmlString) {
  const jobIDRegex = /Job ID (\w+)/;
  const jobIDMatch = htmlString.match(jobIDRegex);
  const referenceNumber = jobIDMatch ? jobIDMatch[1] : "";
  return referenceNumber;
}
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function extractIDFromURL(url) {
  // Extract the ID using regular expression
  const idRegex = /(?<=-)[a-f0-9]{32}/;
  const idMatch = url.match(idRegex);

  if (idMatch) {
    const jobID = idMatch[0];
    return jobID;
  } else {
    return uuidv4();
  }
}
function selectRandomSentence() {
  const sentences = [
    "If you're interested in this post, please visit the link below and complete the application form. Simply click on the provided link and enter your genuine details in the application form.",
    "To apply for this position, all interested candidates must visit the following link and submit the application form. Just click on the provided link and ensure you provide accurate information in the form.",
    "We invite all candidates interested in this post to access the link below and proceed with the application process. By clicking on the provided link, you can fill out the application form with authentic information.",
    "All aspiring candidates for this position are encouraged to visit the provided link and fill out the application form. Simply click on the link below and provide truthful details in the application.",
    "If you have an interest in this post, please follow the link below to access the application form. By clicking on the link, you will be able to enter genuine information in the form.",
    "We kindly request all interested candidates to visit the below link and complete the application form. By clicking on the link provided below, you can fill out the application form with accurate details.",
    "To express your interest in this post, we ask all candidates to click on the link below and complete the application form. Ensure you provide genuine information when filling out the form.",
    "All candidates who wish to apply for this post should visit the provided link and fill out the application form. Click on the link below and make sure to enter authentic details in the form.",
    "Interested candidates are advised to visit the below link and proceed with the application process. By clicking on the provided link, you can fill out the application form with genuine information.",
    "If you're interested in this post, please access the link below to fill out the application form. Click on the provided link and enter accurate details in the form to complete the application process.",
  ];

  const randomIndex = Math.floor(Math.random() * sentences.length);
  return sentences[randomIndex];
}
function removeQueryParamsFromURL(url) {
  const parsedURL = new URL(url);
  parsedURL.search = "";

  return parsedURL.href;
}

// Example usage

module.exports = {
  sgbFetchById,
};
