const axios = require("axios");
const cheerio = require("cheerio");
const FormData = require("form-data");
const format = require("date-fns/format");
const provinces = require("../provinces");

const slugify = require("slugify");
const db = require("../models");
const chalk = require("chalk");
const { generateIntroduction } = require("./sentences.js");
const { extractDataFromHTML } = require("./jqHelper");
const defaultimgs = require("../data/links.json");
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
async function getFeaturedImage() {
  const img = await db.FeaturedImage.find({}).limit(1);
  if(img.length>0){
    return img[0].src;

  }
  return "";
}
async function getMetaTitleEnd() {
  const t = await db.MetaTitle.find({}).limit(1);
  if (t.length > 0) {
    return t[0].title;
  }
  return ``;
}
async function getJobSchemaById(id) {
  const fImage = await getFeaturedImage();
  const meta_title = await getMetaTitleEnd();
 
  const defaultimg =
    fImage || `https://canadain.org/wp-content/uploads/c/CanadaIn.png`;

  const postUrl = `https://www.jobbank.gc.ca/jobsearch/jobposting/${id}?source=searchresults`;
  try {
    const res = await axios.get(postUrl);
 
    const $ = cheerio.load(res.data);
     

    var bodyFormData = new FormData();
    bodyFormData.append("seekeractivity:jobid", id);
    bodyFormData.append("seekeractivity_SUBMIT", "1");
    bodyFormData.append("jakarta.faces.ViewState", "stateless");
    bodyFormData.append("jakarta.faces.behavior.event", "action");
    bodyFormData.append("action", "applynowbutton");
    bodyFormData.append("jakarta.faces.partial.event", "click");
    bodyFormData.append("jakarta.faces.source", "seekeractivity");
    bodyFormData.append("jakarta.faces.partial.ajax", "true");
    bodyFormData.append("jakarta.faces.partial.execute", "jobid");
    bodyFormData.append("jakarta.faces.partial.render", "applynow markappliedgroup");
    bodyFormData.append("seekeractivity:seekeractivity", "");
    
    const formResp = await axios({
      method: "POST",
      url: postUrl,
      data: bodyFormData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "ISTL-INFINITE-LOOP": postUrl,
      },
    });

   

    const applyNowData = cheerio.load(formResp.data);
 

    const jobTitle = $("[property='title']").text().trim();
     
    const hiringOrganization = $('[property="hiringOrganization"]')
      .text()
      .trim();
    const hiringOrganizationLink = $('[property="hiringOrganization"] a').attr(
      "href"
    );

    const salary = $('[property="value"]').text().trim();
    let joblocation = getSpanElementsWithComma(
      $('[property="joblocation"]').html()
    );
    const isRemoteJob = $(".job-posting-brief")
      ?.text()
      ?.includes("Remote work available");

    joblocation.length === 0
      ? (joblocation = $('[property="address"]')
          .first()
          .text()
          .trim()
          .replace(", ,", ","))
      : null;
    const vacancy = $($(".fa.fa-user").siblings()[1]).text().trim();
    const jobType = $('[property="employmentType"]').text().trim();

 

    const emailToApply = $(applyNowData("#htaemail").next()).text();
    const applyByfax = $(applyNowData("#htafax").next()).text();
    const applyByMailHtml = $(applyNowData("#htamail").next()).html();
    const applyByMail = extractDataFromHTML(applyByMailHtml);
    const applyInPersonHTML = applyNowData("#htainperson")?.next().html();

    const applyInPerson = extractDataFromHTML(applyInPersonHTML);
    const applyOnline = $(
      applyNowData("#htaonline")?.next()?.children()[0]
    )?.text();
    const applyByPhone = $(applyNowData("#htaphone").next())
      ?.clone()
      .children()
      .remove()
      .end()
      .text();

    const howToApplySchema = {
      emailToApply: emailToApply
        ? emailToApply.replace(/\t/g, "").replace(/\n/g, "")
        : "",
      applyByMail: applyByMail ? applyByMail.replace(/\t/g, "") : "",
      applyByfax: applyByfax
        ? applyByfax.replace(/\t/g, "").replace(/\n/g, "")
        : "",
      applyInPerson: applyInPerson ? applyInPerson.replace(/\t/g, "") : "",
      applyOnline: applyOnline
        ? applyOnline.replace(/\t/g, "").replace(/\n/g, "")
        : "",
      applyByPhone: applyByPhone
        ? applyByPhone.replace(/\t/g, "").replace(/\n/g, "")
        : "",
    };

    const description = $(".job-posting-detail-requirements").html();
    const lmia = $(".disclaimer").text();

    const shift = $('[property="specialCommitments"]').text().trim();
    const currency = $('[property="currency"]').attr("content");
    const baseSalaryType = $('[property="baseSalary"]').attr("typeof");
    const unitText = $('[property="unitText"]').text();
    const minValue = $('[property="minValue"]').attr("content");
    const maxValue = $('[property="maxValue"]').attr("content");
    const dateString = $('[property="datePosted"]')
      .text()
      .replace(" Posted on ", "")
      .replace("\n\t\t\t", "");
    const validDateString = $('[property="validThrough"]')
      .text()
      .replace(" Posted on ", "")
      .replace("\n\t\t\t", "");


    const experienceRequirements = $(
      '[property="experienceRequirements qualification"]'
    )
      .children()
      .text();
    const educationRequirements = $(
      '[property="educationRequirements qualification"]'
    )
      .children()
      .text();

       
    const employmentType = $('[property="employmentType"]').children().text();
    let streetAddress = $('[property="streetAddress"]').text();
    let postalCode = $('[property="postalCode"]').text();
    const addressLocality = $('[property="addressLocality"]').first().text();
    const addressRegion = $('[property="addressRegion"]').first().text();
    const value = maxValue ? `${minValue}-${maxValue}` : minValue;
    const dP = format(new Date(dateString), "MMMM dd, yyyy");
    const datePosted = format(new Date(dP), "yyyy-MM-dd");
    
    const vt = format(new Date(validDateString), "MMMM dd, yyyy");
    const validThrough = format(new Date(vt), "yyyy-MM-dd");
    
    var instructionsListJq = applyNowData(
      'h4:contains("How-to-apply instructions") '
    ).siblings("ul");
    var referenceNumber = applyNowData(
      ' h4:contains("Include this reference number in your application") '
    )
      ?.next()
      ?.text()
      ?.trim();

    var instructionsList = [];
    if (instructionsListJq.length > 0) {
      instructionsListJq.slice(0, 1).each(function (index) {
        $(this)
          .children()
          .each((idx, cont) => {
            instructionsList.push($(cont).text());
          });
      });
    }

    // const addressSchema = await getFullJobLocation(
    //   `${hiringOrganization} , ${joblocation}`,
    //   joblocation,
    //   hiringOrganization
    // );
    let addressSchema = {};

    addressSchema = await getFullJobLocation(
      `${hiringOrganization} , ${joblocation}`,
      joblocation,
      hiringOrganization
    );

    if (!postalCode.length > 0 && !streetAddress.length > 0) {
      if (Object.values(addressSchema).length > 0) {
        postalCode =
          addressSchema.postalCode.length > 0 ? addressSchema.postalCode : "";
        streetAddress = addressSchema.streetAddress;
      } else {
        postalCode = "";
        streetAddress = "";
      }
    }
    const metaTitle = `Hiring: ${capitalizeFirstLetter(
      jobTitle
    )} | ${joblocation} - ${meta_title.length > 0 ? meta_title : ""}`;
    const formatSalary = (str = "") => {
      return str.replace("HOUR", "").replace("WEEKLY", "").replace("YEAR", "");
    };
    const jobTitleFormatter = () => {
      if (lmia && lmia.includes("LMIA")) {
        return capitalizeFirstLetter(jobTitle) + " | LMIA approved ";
      } else {
        return capitalizeFirstLetter(jobTitle);
      }
    };
    function getSpanElementsWithComma(htmlString) {
      if (!htmlString) return "";
      const parsedHTML = $.parseHTML(htmlString);
      const spanElements = $(parsedHTML).find("span.city > span");
      const values = [];

      spanElements.each(function () {
        const text = $(this).text().trim();
        if (text !== "") {
          values.push(text);
        }
      });

      return values.join(", ");
    }

    const introduction = await generateIntroduction({
      jobTitle: capitalizeFirstLetter(jobTitle),
      jobLocation: joblocation,
      LMIA: lmia?.includes("LMIA") ? "Yes" : "No",
      employerName: hiringOrganization,
      shift: shift,
      jobType: jobType
        ? jobType.replace("employmentFull", "employment or Full")
        : "",
      isRemote: isRemoteJob,
    });
    
    const formattedDescription = "";

    const jobDetails = {
      jobTitle: capitalizeFirstLetter(jobTitle),
      id: parseInt(id),
      introTest: introduction,
      featuredImg: defaultimg,
      jobPostingWidget: {
        LMIA: lmia?.includes("LMIA") ? "Yes" : "No",
        employerName: hiringOrganization,
        website: hiringOrganizationLink,
        vacancy,
        salary: salary ? formatSalary(salary) : "",
        jobType: jobType
          ? jobType
              .replace("employmentFull", "employment - Full")
              .replace("employmentPart", "employment - Part")
          : "",
        shift,
        joblocation,
      },

      howToApply: getRandomInstruction(),

      howToApplySchema,
      requiredDocuments: {
        instructionsList: instructionsList.join("\n\n"),
        referenceNumber: referenceNumber,
      },
      jobRequirement: description?.replace(/\s\s+/g, " "),
      // howToApply: howToApply?.replace(/\s\s+/g, " "),
      slug: slugify(jobTitle.toLowerCase() + "-" + id, {
        replacement: "-",
        remove: /[*+~.()'"!:@]/g,
        lower: true,
      }),
      meta: {
        id,
        description: introduction,
        title: metaTitle,
        slug: slugify(jobTitle.toLowerCase() + "-" + id, {
          replacement: "-",
          remove: /[*+~.()'"!:@]/g,
          lower: true,
        }),
      },
      introduction: introduction,
      jobPostingSchema: {
        
        title: jobTitleFormatter(),
        description: formattedDescription,
        baseSalary: {
          ["@type"]: baseSalaryType,
          currency: currency,
          value: {
            
            value,
            unitText: unitText,
          },
        },
        datePosted,
        validThrough,
        employmentType: getEmploymentType(employmentType),
        hiringOrganization: {
          ["@type"]: "Organization",
          name: hiringOrganization,
          sameAs: hiringOrganizationLink,
          logo: defaultimg,
        },
        jobLocation: {
          ["@type"]: "Place",
          address: {
           
            streetAddress: streetAddress,
            addressLocality: addressLocality,
            addressRegion: findCanadaProvinceName(addressRegion),
            postalCode: postalCode,
            addressCountry: "Canada",
          },
        },

        experienceInPlaceOfEducation: "False",
        educationRequirements: [educationRequirements.replace(/\s\s+/g, " ")],
        experienceRequirements: experienceRequirements,

        mainEntityOfPage: {
          ["@id"]: hiringOrganizationLink
            ? hiringOrganizationLink
            : "https://canadain.org/worker-landscape/#webpage",
        },
      },
    };

    
    if (!salary || salary.length == 0) {
      return {};
    }
    

    if (isRemoteJob) {
      jobDetails.jobPostingSchema.jobLocationType = "TELECOMMUTE";
      jobDetails.jobPostingSchema.applicantLocationRequirements = [
        {
          "@type": "Country",
          name: "Canada",
        },
      ];
    }

    return jobDetails;
  } catch (err) {
    console.log(err)
    console.log("Not Available");
  }
}
 
 
function findTwoLetterWordsInCapital(text) {
  const words = text.split(" ");

  const twoLetterWords = words.filter((word) =>
    /^[A-Z]{2}$/.test(word.replace(",", ""))
  );

  return twoLetterWords.length ? twoLetterWords[0] : "";
}
const provincesList = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  NT: "Northwest Territories",
  NU: "Nunavut",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  YT: "Yukon",
};
function findCanadaProvinceName(str) {
  const formattedStr = str.toLowerCase();
  for (const key in provincesList) {
    if (provincesList.hasOwnProperty(key)) {
      if (
        formattedStr.includes(key) ||
        formattedStr.includes(provincesList[key].toLowerCase()) ||
        String(findTwoLetterWordsInCapital(str)).includes(key)
      ) {
        return provincesList[key];
      }
    }
  }

  return null; // Return null if no match is found
}
const getEmploymentType = (str) => {
  if (str == "Part time leading to full time") {
    return ["Part time"];
  } else if (str === "Full time") {
    return ["FULL_TIME"];
  } else {
    return ["FULL_TIME"];
  }
};
// getJobSchemaById(38170276);
const getRegion = (addressRegion) => {
  const str = provinces.find(
    (pr) => pr.key === addressRegion.replace(", ", "")
  )?.name;
  if (str) {
    return str;
  } else {
    return addressRegion;
  }
};
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
async function getEmployerByName(employerName) {
  const employer = await db.Employer.findOne({ name: employerName });
  return employer;
}
async function getFullJobLocation(employerNameWithAddr, addr, employerName) {
  const employer = await getEmployerByName(employerName);
   if (
    employer &&
    employer.address &&
    Object.keys(employer.address).length > 0 &&
    employer.address.streetAddress !== undefined
  ) {
    console.log("Not Accessing GeoLocation API..");
    return employer.address;
  }

  if (
    process.env.ENABLE_GEOLOCATION === undefined ||
    process.env.ENABLE_GEOLOCATION === "false"
  ) {
    return {
      streetAddress: "",
      postalCode: "",
    };
  }

  const apiKey = `AIzaSyC1mzGeDRpO001T_a0o7_GLlrdoYjV7miA`;
  const urlq = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${employerNameWithAddr.replace(
    /\d+/g,
    ""
  )}&key=${apiKey}`;

  console.log(
    chalk.bgCyan.whiteBright(
      `${employerName} is not in our database fetching its address and adding to DB`
    )
  );

  try {
    const mapResponse = await axios.get(urlq);

    if (
      mapResponse.data &&
      mapResponse.data.status === "OK" &&
      mapResponse.data.results.length > 0
    ) {
      const addr = mapResponse.data.results[0]?.formatted_address.split(",");
      const streetAddress = addr[0];
      const postalCode = addr[2]?.split(" ").slice(-2).join(" ");
      return {
        streetAddress,
        postalCode,
      };
    } else {
      const urlWithRes = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants%20${addr.replace(
        /\d+/g,
        ""
      )}&key=${apiKey}`;
      const mapResponse = await axios.get(urlWithRes);
      if (
        mapResponse.data &&
        mapResponse.data.status === "OK" &&
        mapResponse.data.results.length > 0
      ) {
        const addr = mapResponse.data.results[0]?.formatted_address.split(",");
        const streetAddress = addr[0];
        const postalCode = addr[2]?.split(" ").slice(-2).join(" ");
        return {
          streetAddress,
          postalCode,
        };
      }
    }
  } catch (err) {
    console.log(err);
    return {
      streetAddress: "",
      postalCode: "",
    };
  }
}
function getMetaDescription(educationRequirements) {
  if (educationRequirements.includes("No")) {
    return `The candidate does not require to have any  minimum qualification`;
  } else {
    return `The candidate should have minimum qualification of ${educationRequirements} certificate`;
  }
}

// (async()=>{
//   await db.Job.deleteMany({});
// console.log("All documents removed!");
// })()
module.exports = {
  getJobSchemaById,
};
