const db = require("../models");
async function generateIntroduction({
  employerName,
  jobLocation,
  jobTitle,
  jobType,
  shift,
  LMIA,
  isRemote = false,
}) {
  let sentence = await generateParagraph({
    jobTitle,
    jobType,
    jobLocation,
    LMIA,
    shift,
    employerName,
    isRemote,
  });

  return sentence;
}

async function firstSentenceGenerator({ employerName, jobLocation, jobTitle }) {
  const sentence1 = await db.IntroductionSentences.findOne({
    sentenceOrder: "sentence_1",
  });
  const randomIndex = Math.floor(Math.random() * sentence1.options.length);

  let sentence = sentence1.options[randomIndex]
    .replace("employerName", employerName)
    .replace("joblocation", jobLocation)
    .replace("jobTitle", jobTitle);
  return sentence;
}

function createNewSentence(sentencesArray, variableName, data) {
  const randomIndex = Math.floor(Math.random() * sentencesArray.length);
  let sentence = sentencesArray[randomIndex];

  if (sentence.includes(variableName)) {
    sentence = sentence.replace(variableName, data);
  }

  return sentence;
}

function selectRandomParagraph(sentencesArray) {
  const randomIndex = Math.floor(Math.random() * sentencesArray.length);
  let sentence = sentencesArray[randomIndex];
  return sentence;
}
async function generateParagraph({
  jobTitle,
  jobType,
  jobLocation,
  LMIA,
  shift,
  employerName,
  isRemote = false,
}) {
  let paragraph = "";
  let sentenceNumber = 1;

  if (jobTitle) {
    const newSentence1 = await firstSentenceGenerator({
      employerName,
      jobLocation,
      jobTitle,
    });
  
    const sentence2 = await db.IntroductionSentences.findOne({
      sentenceOrder: "sentence_2",
    });
    const newsentence2 = selectRandomParagraph(sentence2.options);
    paragraph += newSentence1 + " " + newsentence2 + " ";
  }

  if (jobType) {
    const sentence3 = await db.IntroductionSentences.findOne({
      sentenceOrder: "sentence_3",
    });

    const newSentence3 = createNewSentence(
      sentence3.options,
      "jobType",
      jobType
    );
    paragraph += newSentence3 + " ";
  }

  if (shift !== "") {
    const sentence4 = await db.IntroductionSentences.findOne({
      sentenceOrder: "sentence_4",
    });
    const newSentence4 = createNewSentence(
      sentence4.options,
      "shiftToReplace",
      shift
    );
    paragraph += newSentence4 + " ";
  }

  if (LMIA == "Yes") {
    const sentence5 = await db.IntroductionSentences.findOne({
      sentenceOrder: "sentence_5",
    });
    const newSentence5 = createNewSentence(
      sentence5.options,
      "jobTitle",
      jobTitle
    );
    paragraph += newSentence5 + " ";
  }
  if (isRemote) {
    const sentence6 = await db.IntroductionSentences.findOne({
      sentenceOrder: "sentence_6",
    });
    const newSentence5 = createNewSentence(
      sentence6.options,
      "jobTitle",
      jobTitle
    );
    paragraph += newSentence5 + " ";
  }

  return paragraph;
}

// function selectAndReplaceDataFrom

// create a function to add introsenteceto

async function addIntroTodb(){

  const sentences3 = [
    "The candidate will also have the option of working remotely.",
    "The applicant may also work remotely.",
    "Applicants will also have an opportunity to work remotely.",
    "Candidates may also be able to work remotely.",
  ];
  const intro = await db.IntroductionSentences.create({
    sentenceOrder:'sentence_6',
    options:sentences3
  })
  console.log(' sentence_3 is Added to DB')

}

async function updateSentence(){
  const sentence = await db.IntroductionSentences.findOne({
    sentenceOrder: "sentence_2",
  });
  sentence.title = "General";
  await sentence.save();
  console.log(' title  is Updated ')
}
// updateSentence()
// addIntroTodb()
module.exports = {
  generateIntroduction,
};
