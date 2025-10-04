const cheerio = require("cheerio");

function createKeyValuePair($) {
  if (!$) {
    console.log("No Job requirement");
    return;
  }
  if (typeof $ !== "function") {
    console.log("jquery not loaded is a function");
    return;
  }

  
  var data = {};
  var language = $('div#comparisonchart h4:contains("Languages")').next(
    'p[property="qualification"]'
  );
  // console.log($('div#comparisonchart').text())
  if (language.length) {
    data.languages = [];
    data.languages.push(language.text().trim());
  }

  // Education
  var educationList = $('div#comparisonchart h4:contains("Education")').next(
    'ul[property="educationRequirements qualification"]'
  );

  if (educationList.length) {
    //ADDED li here inplace of span

    data.educationRequirements = [];
    educationList.find("li").each(function () {
      var education = $(this).text().trim();
      if (education !== "") {
        data.educationRequirements.push(education);
      }
    });
  }
  // Experience
  var experience = $('div#comparisonchart h4:contains("Experience")').next(
    'p[property="experienceRequirements qualification"]'
  );
  if (experience.length) {
    data.experienceRequirements = [];
    data.experienceRequirements.push(experience.text().trim());
  }

  var workSetting = $('div#comparisonchart h4:contains("Work setting")').next(
    "ul.csvlist"
  );
  if (workSetting.length) {
    data.workSetting = [];
    workSetting.find("span").each(function () {
      data.workSetting.push($(this).text().trim());
    });
  }

  // Skills
  data.skills = {};
  data.experienceAndSpecialisation = {};

  // responsibilities
  var responsibilitiesList = $(
    'div[property="responsibilities"] h4:contains("Tasks")'
  ).next("ul.csvlist");
  if (responsibilitiesList.length) {
    data.responsibilities = [];
    responsibilitiesList.find("span").each(function () {
      data.responsibilities.push($(this).text().trim());
    });
  }

  // Security and safety
  var securitySafetyList = $(
    'div[property="skills"] h4:contains("Security and safety")'
  ).next("ul.csvlist");
  if (securitySafetyList.length) {
    data.skills.securityAndSafety = [];
    securitySafetyList.find("span").each(function () {
      data.skills.securityAndSafety.push($(this).text().trim());
    });
  }

  // Transportation/travel information
  var transportationTravelList = $(
    'div[property="skills"] h4:contains("Transportation/travel information")'
  ).next("ul.csvlist");
  if (transportationTravelList.length) {
    data.skills.transportationTravelInformation = [];
    transportationTravelList.find("span").each(function () {
      data.skills.transportationTravelInformation.push($(this).text().trim());
    });
  }

  // Work conditions and physical capabilities
  var workConditionsList = $(
    'div[property="skills"] h4:contains("Work conditions and physical capabilities")'
  ).next("ul.csvlist");
  if (workConditionsList.length) {
    data.skills.workConditionsPhysicalCapabilities = [];
    workConditionsList.find("span").each(function () {
      data.skills.workConditionsPhysicalCapabilities.push(
        $(this).text().trim()
      );
    });
  }

  var targetAudienceList = $(
    'div[property="experienceRequirements"] h4:contains("Target audience")'
  ).next("ul.csvlist");

  if (targetAudienceList.length) {
    data.experienceAndSpecialisation.targetAudienceList = [];
    targetAudienceList.find("span").each(function () {
      data.experienceAndSpecialisation.targetAudienceList.push(
        $(this).text().trim()
      );
    });
  }

  var computerAndTechnologyKnowledge = $(
    'div[property="experienceRequirements"] h4:contains("Computer and technology knowledge")'
  ).next("ul.csvlist");

  if (computerAndTechnologyKnowledge.length) {
    data.experienceAndSpecialisation.computerAndTechnologyKnowledge = [];
    computerAndTechnologyKnowledge.find("span").each(function () {
      data.experienceAndSpecialisation.computerAndTechnologyKnowledge.push(
        $(this).text().trim()
      );
    });
  }
  var areaOfSpecialization = $(
    'div[property="experienceRequirements"] h4:contains("Area of specialization")'
  ).next("ul.csvlist");

  if (areaOfSpecialization.length) {
    data.experienceAndSpecialisation.areaOfSpecialization = [];
    areaOfSpecialization.find("span").each(function () {
      data.experienceAndSpecialisation.areaOfSpecialization.push(
        $(this).text().trim()
      );
    });
  }

  var teachingFormatExperience = $(
    'div[property="experienceRequirements"] h4:contains("Teaching format experience")'
  ).next("ul.csvlist");

  if (teachingFormatExperience.length) {
    data.experienceAndSpecialisation.teachingFormatExperience = [];
    teachingFormatExperience.find("span").each(function () {
      data.experienceAndSpecialisation.teachingFormatExperience.push(
        $(this).text().trim()
      );
    });
  }

  var benefitsData = [];

  // Check if the jobBenefits div exists
  if ($('div[property="jobBenefits"]').length !== 0) {
    // Extract heading and content using jQuery
    $('div[property="jobBenefits"] h4').each(function () {
      var content = [];

      // Extract content values for each heading
      $(this)
        .next("ul.csvlist")
        .find("li span")
        .each(function () {
          benefitsData.push($(this).text());
        });

      // benefitsData.push(content);
    });
    data.benefitsData = benefitsData;
  }

  // Weight handling
  var weightHandlingList = $(
    'div[property="skills"] h4:contains("Weight handling")'
  ).next("ul.csvlist");
  if (weightHandlingList.length) {
    data.skills.weightHandling = [];
    weightHandlingList.find("span").each(function () {
      data.skills.weightHandling.push($(this).text().trim());
    });
  }

  // Personal suitability
  var personalSuitabilityList = $(
    'div[property="skills"] h4:contains("Personal suitability")'
  ).next("ul.csvlist");
  if (personalSuitabilityList.length) {
    data.skills.personalSuitability = [];
    personalSuitabilityList.find("span").each(function () {
      data.skills.personalSuitability.push($(this).text().trim());
    });
  }

  return data;
}

// Call the function with your generated key-value pair

// generateSentence(data);

// function generateSentences(data) {
//   const sentences = [];

//   // Skills
//   if (data.skills && typeof data.skills === "object") {
//     const skillsSentences = Object.entries(data.skills).flatMap(
//       ([key, subSkills]) => {
//         if (subSkills && Array.isArray(subSkills)) {
//           const formattedKey = key.replace(/([a-z])([A-Z])/g, "$1 $2"); // Add space between camelCase words
//           const subSkillsSentences = subSkills.map(
//             (skill) => `Required ${formattedKey} skill: ${skill.trim()}.`
//           );
//           return subSkillsSentences;
//         }
//         return [];
//       }
//     );
//     sentences.push(...skillsSentences);
//   }

//   // Languages
//   if (data.languages && typeof data.languages === "string") {
//     const languagesSentence = `Proficiency in ${data.languages.trim()} is required.`;
//     sentences.push(languagesSentence);
//   }

//   // Education Requirements
//   if (data.educationRequirements && Array.isArray(data.educationRequirements)) {
//     const educationRequirementsSentences = data.educationRequirements.map(
//       (requirement) => {
//         const trimmedRequirement = requirement.trim();
//         return trimmedRequirement.length > 0
//           ? `Education Requirement: ${trimmedRequirement}.`
//           : "";
//       }
//     );
//     sentences.push(
//       ...educationRequirementsSentences.filter(
//         (sentence) => sentence.length > 0
//       )
//     );
//   }

//   // Experience Requirements
//   if (
//     data.experienceRequirements &&
//     typeof data.experienceRequirements === "string"
//   ) {
//     const experienceRequirementsSentence = `Experience Requirement: ${data.experienceRequirements.trim()}.`;
//     sentences.push(experienceRequirementsSentence);
//   }

//   // Work Conditions and Physical Capabilities
//   if (
//     data.workConditionsPhysicalCapabilities &&
//     Array.isArray(data.workConditionsPhysicalCapabilities)
//   ) {
//     const workConditionsSentences = data.workConditionsPhysicalCapabilities.map(
//       (condition) => {
//         const trimmedCondition = condition.trim();
//         return trimmedCondition.length > 0
//           ? `Work Condition: ${trimmedCondition}.`
//           : "";
//       }
//     );
//     sentences.push(
//       ...workConditionsSentences.filter((sentence) => sentence.length > 0)
//     );
//   }

//   // Weight Handling
//   if (data.weightHandling && Array.isArray(data.weightHandling)) {
//     const weightHandlingSentences = data.weightHandling.map((weight) => {
//       const trimmedWeight = weight.trim();
//       return trimmedWeight.length > 0
//         ? `Weight Handling: ${trimmedWeight}.`
//         : "";
//     });
//     sentences.push(
//       ...weightHandlingSentences.filter((sentence) => sentence.length > 0)
//     );
//   }

//   // Personal Suitability
//   if (data.personalSuitability && Array.isArray(data.personalSuitability)) {
//     const personalSuitabilitySentences = data.personalSuitability.map(
//       (suitability) => {
//         const trimmedSuitability = suitability.trim();
//         return trimmedSuitability.length > 0
//           ? `Personal Suitability: ${trimmedSuitability}.`
//           : "";
//       }
//     );
//     sentences.push(
//       ...personalSuitabilitySentences.filter((sentence) => sentence.length > 0)
//     );
//   }

//   return sentences;
// }

function generateSentences(data) {
  const {
    skills,
    languages,
    educationRequirements,
    experienceRequirements,
    responsibilities,
  } = data;

  // Validate required fields

  const sentences = [];

  // Generate sentences for skills
  if (skills) {
    const {
      securityAndSafety,
      transportationTravelInformation,
      workConditionsPhysicalCapabilities,
      weightHandling,
      personalSuitability,
    } = skills;
    sentences.push(`Languages: ${languages}`);

    // Generate sentence for education requirements
    if (
      educationRequirements &&
      Array.isArray(educationRequirements) &&
      educationRequirements.length > 0
    ) {
      sentences.push(
        `Education requirements: ${educationRequirements.join(", ")}`
      );
    }

    // Generate sentence for experience requirements
    sentences.push(`Experience requirements: ${experienceRequirements}`);

    if (
      personalSuitability &&
      Array.isArray(personalSuitability) &&
      personalSuitability.length > 0
    ) {
      sentences.push(
        `Skills: Personal suitability - ${personalSuitability.join(", ")}`
      );
    }
    if (
      securityAndSafety &&
      Array.isArray(securityAndSafety) &&
      securityAndSafety.length > 0
    ) {
      sentences.push(
        `Skills: Security and safety - ${securityAndSafety.join(", ")}`
      );
    }

    if (
      transportationTravelInformation &&
      Array.isArray(transportationTravelInformation) &&
      transportationTravelInformation.length > 0
    ) {
      sentences.push(
        `Skills: Transportation/travel information - ${transportationTravelInformation.join(
          ", "
        )}`
      );
    }

    if (
      workConditionsPhysicalCapabilities &&
      Array.isArray(workConditionsPhysicalCapabilities) &&
      workConditionsPhysicalCapabilities.length > 0
    ) {
      sentences.push(
        `Skills: Work conditions and physical capabilities - ${workConditionsPhysicalCapabilities.join(
          ", "
        )}`
      );
    }

    if (
      weightHandling &&
      Array.isArray(weightHandling) &&
      weightHandling.length > 0
    ) {
      sentences.push(`Skills: Weight handling - ${weightHandling.join(", ")}`);
    }
  }

  // Generate sentence for languages

  //   Generate sentence for responsibilities
  if (
    responsibilities &&
    Array.isArray(responsibilities) &&
    responsibilities.length > 0
  ) {
    sentences.push(`Responsibilities: ${responsibilities.join(", ")}`);
  }

  return sentences;
}

const getDetailsFromReq = (job_requirement) => {
  const $ = cheerio.load(job_requirement);
  const responsibilities = $('[property="responsibilities"]')
    ?.text()
    ?.trim()
    ?.replace("Tasks", "");
  const experienceRequirements = $('[property="experienceRequirements"]')
    ?.text()
    ?.trim()
    ?.replace("Tasks", "");

  //   console.log(createKeyValuePair($));
  return {
    responsibilities: responsibilities.length > 0 ? responsibilities : null,
  };
};
function convertToCamelCase(str) {
  // Split the string into words
  const words = str.toLowerCase().split(" ");

  // Capitalize the first letter of each word except the first word
  const camelCasedWords = words.map((word, index) => {
    if (index === 0) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  // Join the words together
  const camelCaseString = camelCasedWords.join("");

  return camelCaseString;
}
module.exports = {
  createKeyValuePair,
  generateSentences,
};
