const cheerio = require("cheerio");
const db = require("../../models/index");
const { createKeyValuePair } = require("./keyValue");
const chalk = require("chalk");
const { flattenObject } = require("../methods");

async function createnewSentence() {
  const currentDate = new Date();
  const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  const previousWeekData = await db.Job.find({
    date: { $gte: oneWeekAgo, $lt: currentDate },
  });
  const jobs = await db.Job.find({
    date: { $gte: oneWeekAgo, $lt: currentDate },
  }).select("jobRequirement_old");

  jobs.forEach((job) => {
    if (job.jobRequirement_old) {
      const keyValuePair = createKeyValuePair(
        cheerio.load(job.jobRequirement_old)
      );
      Object.keys(keyValuePair).map((key) => {
        if (key == "skills") {
          Object.keys(keyValuePair["skills"]).map((key) => {
            checkAndAddSentencesInHeading(key, keyValuePair["skills"][key]);
          });
          return;
        }
        checkAndAddSentencesInHeading(key, keyValuePair[key]);
      });

      //   console.log(keyValuePair);
    }
  });
}
// createnewSentence();
async function removeAllDuplicated() {
  const sentences = await db.Sentences.find({}).select("_id");
  sentences.forEach(async (sentence) => {
    await removeDuplicateSentences(sentence._id);
  });
}
// removeAllDuplicated();
async function removeDuplicateSentences(headingId) {
  try {
    const heading = await db.Sentences.findById(headingId);
    if (!heading) {
      console.log("Heading not found.");
      return;
    }

    const uniqueSentences = [...new Set(heading.sentences)];
    heading.sentences = uniqueSentences;

    await heading.save();
    console.log("Duplicate sentences removed.");
  } catch (error) {
    console.error("Error removing duplicate sentences:", error);
  }
}

async function createSentenceWithHeading(heading, sentences) {
  if (!heading || !sentences) {
    return console.log("All Data not given");
  }

  const sentenceInDB = await db.Sentences.findOne({ heading });
  if (sentenceInDB === null) {
    const newSenteceWithHeading = await db.Sentences.create({
      heading,
      sentences,
    });
    console.log(newSenteceWithHeading._id);
  } else {
    console.log(chalk.green(`sentence in database`), sentenceInDB);
  }

  //check if heading availble

  // const sentenceInDb = await db.
}

// Function to check if a sentence exists in a specific heading and add it if missing
async function checkAndAddSentence(heading, sentence) {
  try {
    const existingHeading = await db.Sentences.findOne({ heading });
    if (existingHeading && !existingHeading.sentences.includes(sentence)) {
      existingHeading.sentences.push(sentence);
      await existingHeading.save();
      console.log(
        chalk.bgYellow.green(
          `Sentence '${sentence}' added to the heading '${heading}'.`
        )
      );
    } else if (!existingHeading) {
      await db.Sentences.create({ heading, sentences: [sentence] });
      console.log(
        chalk.blueBright(
          `New Heading =>'${heading}' created with sentence '${sentence}'.`
        )
      );
    }
  } catch (error) {
    console.error(
      `Error checking and adding sentence '${sentence}' in heading '${heading}':`,
      error
    );
  }
}

// Function to check each sentence inside a given heading and add the missing ones
async function checkAndAddSentencesInHeading(heading, sentences) {
  try {
    for (const sentence of sentences) {
      await checkAndAddSentence(heading, sentence);
    }
    console.log(
      chalk.green(
        `All sentences checked and added if missing in heading '${heading}'.`
      )
    );
  } catch (error) {
    console.error(
      `Error checking and adding sentences in heading '${heading}':`,
      error
    );
  }
}

async function createNewSentencesOption() {
  const sentence = await db.Sentences.findOne({
    _id: "648730284a73d2d2a23fb7ce",
  });
  const newSentenceOption = await db.SentencesOptions.create({
    heading: sentence.heading,
    sentences: sentence.sentences.map((s) => ({ title: s })),
  });
  console.log(newSentenceOption);
}

// createNewSentencesOption();
async function updateSentenceOptions2({ heading, sentenceTitle, options }) {
  return new Promise(async (resolve, reject) => {
    if (!heading || !sentenceTitle || !options) {
      return reject("Provide all the data");
    }
    const sentence = await db.SentencesOptions.findOne({ heading });

    if (sentence === null) {
      return reject("No Sentence Found");
    }
    const sentenceToUpdate = sentence.sentences.find(
      (sentence) => sentence.title === sentenceTitle
    );
    if (!sentenceToUpdate) {
      return reject("Sentence not found.");
    }
    const newOptions = options;

    const existingOptions = sentenceToUpdate.options;
    const optionsToAdd = newOptions.filter(
      (option) => !existingOptions.includes(option)
    );
    if (optionsToAdd.length === 0) {
      return reject("Options already exist. No need to update.");
    }
    sentenceToUpdate.options.push(...optionsToAdd);
    await sentence.save();
    resolve({
      message: "Sentence is Updated Successfully",
    });
    return sentence;
  });
}
async function updateSentenceOptionsCSV({ heading, sentenceTitle, options }) {
  console.log(options);
  try {
    const result = await db.SentencesOptions.updateOne(
      { heading, "sentences.title": sentenceTitle },
      { $set: { "sentences.$.options": options } }
    );

    if (result.nModified === 0) {
      console.log("No document found or options already exist.");
      return;
    }

    console.log("Options saved successfully.");
  } catch (err) {
    console.error(err);
  }
}
async function updateSentenceOptions({ heading, sentenceTitle, options }) {
  return new Promise(async (resolve, reject) => {
    if (!heading || !sentenceTitle || !options) {
      return reject("Provide all the data");
    }
    const sentence = await db.SentencesOptions.findOne({ heading });
    if (sentence === null) {
      return reject("No Sentence Found");
    }
    const sentenceToUpdate = sentence.sentences.find(
      (sentence) => sentence.title === sentenceTitle
    );
    if (!sentenceToUpdate) {
      return reject("Sentence not found.");
    }
    const newOptions = options;

    sentenceToUpdate.options = newOptions;
    try {
      await sentence.save();
      resolve("Sentence is Updated Successfully");
    } catch (err) {
      reject(err);
    }
    return sentence;
  });
}

async function deleteOption({ heading, sentenceTitle, optionToDelete }) {
  try {
    // Step 1: Retrieve the document containing the sentenceSchema you want to update
    const doc = await db.SentencesOptions.findOne({ heading });

    if (!doc) {
      console.log("No document found.");
      return;
    }

    // Step 2: Find the specific sentenceSchema within the sentences array from which you want to delete an option
    const sentenceToUpdate = doc.sentences.find(
      (sentence) => sentence.title === sentenceTitle
    );

    if (!sentenceToUpdate) {
      console.log("Sentence not found.");
      return;
    }

    // Step 3: Remove the specified option from the options array of the sentenceSchema
    const index = sentenceToUpdate.options.indexOf(optionToDelete);
    if (index > -1) {
      sentenceToUpdate.options.splice(index, 1);
    } else {
      console.log("Option not found.");
      return;
    }

    // Step 4: Save the updated sentencesOptionsSchema document
    const updatedDoc = await doc.save();
    console.log("Option deleted from sentenceSchema successfully:", updatedDoc);
  } catch (err) {
    console.error(err);
  }
}

// createNewSentencesOption();

async function deleteAllRecords() {
  try {
    await db.Sentences.deleteMany({});
    console.log("All records deleted successfully.");
  } catch (error) {
    console.error("Error deleting records:", error);
  }
}
const data = {
  languages: ["English"],
  educationRequirements: ["No degree, certificate or diploma"],
  experienceRequirements: ["Will train"],
  workSetting: [
    "Work in employer's/client's home",
    "Apartment/condominium complex",
    "Office building",
    "Cleaning service company",
    "Commercial building",
    "Private residence",
  ],
  securityAndSafety: ["Bondable", "Criminal record check"],
  transportationTravelInformation: [
    "Own transportation",
    "Own vehicle",
    "Valid driver's licence",
  ],
  workConditionsPhysicalCapabilities: [
    "Physically demanding",
    "Attention to detail",
    "Combination of sitting, standing, walking",
    "Bending, crouching, kneeling",
  ],
  weightHandling: ["Up to 13.5 kg (30 lbs)"],
  personalSuitability: [
    "Client focus",
    "Dependability",
    "Efficient interpersonal skills",
    "Excellent oral communication",
    "Excellent written communication",
    "Flexibility",
    "Initiative",
    "Reliability",
    "Team player",
    "Values and ethics",
    "Judgement",
    "Organized",
    "Punctuality",
  ],
  responsibilities: [
    "Sweep, mop, wash and polish floors",
    "Dust furniture",
    "Vacuum carpeting, area rugs, draperies and upholstered furniture",
    "Make beds and change sheets",
    "Distribute clean towels and toiletries",
    "Clean, disinfect and polish kitchen and bathroom fixtures and appliances",
    "Pick up debris and empty trash containers",
    "Wash windows, walls and ceilings",
    "Address customers' complaints or concerns",
    "Perform light housekeeping and cleaning duties",
  ],
  benefitsData: [
    "Dental plan",
    "Health care plan",
    "Paramedical services coverage",
    "Vision care benefits",
    "Bonus",
    "Commission",
    "Gratuities",
    "Mileage paid",
    "Group insurance benefits",
  ],
};
async function addNewSentences(keyValuePair) {
  const sentencesKeyValuePairs = flattenObject(keyValuePair);

  Object.keys(sentencesKeyValuePairs).map(async (key) => {
    const sentence = await db.SentencesOptions.findOne({ heading: key });
    if (sentence == null) {
      const newOption = {
        heading: key,
        sentences: sentencesKeyValuePairs[key].map((t) => ({
          title: t,
          options: [],
        })),
      };
      await db.SentencesOptions.create(newOption);
      console.log(chalk.green("Added New Sentcence Option To Database ", key));
    } else {
      //check if the sentences of the object is available in the database

      await checkTitlesInDatabase(sentencesKeyValuePairs[key], key);
    }
  });
}

const checkTitlesInDatabase = async (titlesToCheck, heading) => {
  const existingTitles = [];

  for (let index in titlesToCheck) {
    const title = titlesToCheck[index];
    try {
      const result = await db.SentencesOptions.findOne({
        "sentences.title": title,
      });
      if (result) {
        existingTitles.push(title);
      } else {
        db.SentencesOptions.findOne({ heading }).then(async (sent) => {
          sent.sentences.push({ title: title, options: [] });
          await sent.save();
          console.log(`Saved Title ${title} to the ${heading} `);
        });
        await removeDuplicatesByHeading({ heading });

        // await newTitle.save();
      }
    } catch (err) {
      console.error(err);
    }
  }

  // if (existingTitles.length > 0) {
  //   console.log("Titles existing in the database:", existingTitles);
  // } else {
  //   console.log("None of the titles exist in the database.");
  // }
};

async function removeDuplicateTitles({ heading }) {
  try {
    // Retrieve the SentenceOptions document
    const sentenceOptions = await db.SentencesOptions.findOne({
      heading,
    }).exec();

    if (!sentenceOptions) {
      console.log("SentenceOptions document not found.");
      return;
    }

    const { sentences } = sentenceOptions;

    // Create a set to store unique titles
    const uniqueTitles = new Set();

    // Iterate over each sentence and check for duplicates
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i];
      const { title } = sentence;

      // If the title already exists in the set, remove the sentence
      if (uniqueTitles.has(title)) {
        sentences.splice(i, 1);
      } else {
        uniqueTitles.add(title);
      }
    }

    // Save the updated SentenceOptions document
    await db.SentencesOptions.updateOne(
      { _id: sentenceOptions._id },
      { $set: { sentences: sentences } }
    );
    console.log("Duplicate titles removed successfully.");
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

async function removeDuplicatesByHeading({ heading = "benefitsData" }) {
  const sentencesOptions = await db.SentencesOptions.find({
    heading,
  });
  const titles = [];

  const { sentences } = sentencesOptions[0];
  const allDuplicates = checkDuplicates(sentences, "title");
  const uniqueData = Object.values(
    allDuplicates.reduce((acc, obj) => {
      acc[obj.title] = obj;
      return acc;
    }, {})
  );
  if (uniqueData.length > 0) {
    db.SentencesOptions.updateMany(
      { heading },
      {
        $pull: { sentences: { $in: uniqueData } },
      }
    )
      .then((result) => {
        console.log(chalk.bgRed("Duplicate Objects removed successfully."));
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    console.log(chalk.green("No Duplicates Were Found"));
  }

  // console.log(uniqueData);
  return;
}

function checkDuplicates(arr, prop) {
  const duplicates = [];

  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i][prop] === arr[j][prop]) {
        if (arr[i].options.length == 0) {
          duplicates.push(arr[i]);
        }

        if (arr[j].options.length == 0) {
          duplicates.push(arr[j]);
        }
      }
    }
  }

  return duplicates;
}
module.exports = {
  updateSentenceOptions,
  updateSentenceOptionsCSV,
  addNewSentences,
  removeDuplicateTitles,
  removeDuplicatesByHeading,
};
// deleteAllRecords();
