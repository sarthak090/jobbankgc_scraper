const chalk = require("chalk");
const db = require("../../models");
const {
  flattenObject,
  capitalizeFirstLetter,
  splitCamelCase,
} = require("../methods");

async function scraperJobGenerator(keyValuePair) {
  const jobRequirement = flattenObject(keyValuePair);

  return new Promise(async (resolve, reject) => {
    var dataToSend = [];

    for (const key of Object.keys(jobRequirement)) {
      const sentenceOption = await db.SentencesOptions.findOne({
        heading: key,
      });

      if (sentenceOption == null) {
        console.log(chalk.bgRed(` ${key} Data is not in the Database`));
        continue;
      }

      const hasOptions = sentenceOption.sentences.some(
        (sentence) => sentence.options && sentence.options.length > 0
      );
      if (key === "benefitsData") {
        console.log(chalk.red(hasOptions));
      }
      if (hasOptions) {
        const titles =
          typeof jobRequirement[key] === "string"
            ? [jobRequirement[key]]
            : jobRequirement[key];

        const matchedData = {
          heading: key,
          returnedData: getRandomOptionsFromData(sentenceOption, titles),
        };

        dataToSend.push(matchedData);
      } else {
        const matchedData = {
          heading: key,
          returnedData: jobRequirement[key],
        };
        dataToSend.push(matchedData);
      }
    }

    resolve(createSentences(dataToSend));
  });
}

function generateHtml({ headingTag, heading, allData }) {
  const currentData = allData.find((d) => d.heading === heading);

  if (currentData && currentData.heading && currentData.returnedData) {
    let sentence = `<${headingTag}>${capitalizeFirstLetter(
      splitCamelCase(currentData.heading)
    )}</${headingTag}>`;
    sentence += "<ul>";

    for (let i = 0; i < currentData.returnedData.length; i++) {
      sentence += `<li>${currentData.returnedData[i]}</li>`;
    }

    sentence += "</ul>";
    return sentence;
  } else {
    return "";
  }
}

function createSentences(dataArray) {
  let showAdditionHeading = false;
  const weightHandling = generateHtml({
    headingTag: "strong",
    heading: "weightHandling",
    allData: dataArray,
  });
  const personalSuitability = generateHtml({
    headingTag: "strong",
    heading: "personalSuitability",
    allData: dataArray,
  });
  const transportationTravelInformation = generateHtml({
    headingTag: "strong",
    heading: "transportationTravelInformation",
    allData: dataArray,
  });
  const workConditionsPhysicalCapabilities = generateHtml({
    headingTag: "strong",
    heading: "workConditionsPhysicalCapabilities",
    allData: dataArray,
  });
  if (
    weightHandling.length > 0 ||
    personalSuitability.length > 0 ||
    transportationTravelInformation.length > 0 ||
    workConditionsPhysicalCapabilities.length > 0
  ) {
    showAdditionHeading = true;
  }

  let sentences = `
  ${generateHtml({
    headingTag: "strong",
    heading: "languages",
    allData: dataArray,
  })}

  ${generateHtml({
    headingTag: "strong",
    heading: "educationRequirements",
    allData: dataArray,
  })}

  ${generateHtml({
    headingTag: "strong",
    heading: "experienceRequirements",
    allData: dataArray,
  })}

  ${generateHtml({
    headingTag: "h3",
    heading: "responsibilities",
    allData: dataArray,
  })}

  <div class="remove-for-description">
  ${generateHtml({
    headingTag: "h3",
    heading: "workSetting",
    allData: dataArray,
  })}

  ${showAdditionHeading ? "<h3>Additional Information</h3>" : ""}
  
  ${generateHtml({
    headingTag: "h4",
    heading: "weightHandling",
    allData: dataArray,
  })}

  ${generateHtml({
    headingTag: "h4",
    heading: "personalSuitability",
    allData: dataArray,
  })}

  ${generateHtml({
    headingTag: "h4",
    heading: "transportationTravelInformation",
    allData: dataArray,
  })}

  
  ${generateHtml({
    headingTag: "h4",
    heading: "workConditionsPhysicalCapabilities",
    allData: dataArray,
  })}
  ${generateHtml({
    headingTag: "h3",
    heading: "benefits",
    allData: dataArray,
  })}
  </div>
 


  `;

  return sentences;
}

function getRandomOptionsFromData(data, titles) {
  const options = [];

  for (const title of titles) {
    const matchedSentence = data.sentences.find(
      (sentence) => sentence.title === title
    );

    if (matchedSentence && matchedSentence.options.length > 0) {
      const randomIndex = Math.floor(
        Math.random() * matchedSentence.options.length
      );
      const randomOption = matchedSentence.options[randomIndex];
      options.push(randomOption);
    } else {
      // options.push(titles);
    }
  }

  return options;
}

module.exports = scraperJobGenerator;
