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

  // Skills
  data.skills = {};

  var language = $('div#comparisonchart h4:contains("Languages")').next(
    'p[property="qualification"]'
  );

  if (language.length) {
    data.languages = language.text().trim();
  }

  // Education
  var educationList = $('div#comparisonchart h4:contains("Education")').next(
    'ul[property="educationRequirements qualification"]'
  );
  if (educationList.length) {
    data.educationRequirements = [];
    educationList.find("span").each(function () {
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
    data.experienceRequirements = experience.text().trim();
  }
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

async function generateSentence(prompt) {
  const apiEndpoint = "https://api.openai.com/v1/engines/davinci/completions";
  const OpenAIAPIKey = process.env.OPEN_AI_KEY; // Replace with your OpenAI API key

  try {
    const response = await axios.post(
      apiEndpoint,
      {
        prompt: prompt,
        max_tokens: 32,
        temperature: 0.5,
        top_p: 1.0,
        n: 1,
        stop: "\n",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OpenAIAPIKey}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.log(error.response.data);
    throw new Error("Failed to generate sentence from OpenAI.");
  }
}

// Call the function with your generated key-value pair

// generateSentence(data);
const OpenAIAPIKey = process.env.OPEN_AI_KEY; // Replace with your OpenAI API key

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

module.exports = {
  createKeyValuePair,
  generateSentences,
};
