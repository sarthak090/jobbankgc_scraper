require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");

const config = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});
const openai = new OpenAIApi(config);

const cheerio = require("cheerio");
const { createKeyValuePair, generateSentences } = require("./_test");
const chalk = require("chalk");

async function generateIntroduction(job) {
  return "";

  try {
    const widgetData = Object.keys(job.jobPostingWidget).map((key) => {
      return key + " : " + job.jobPostingWidget[key];
    });
    const openaiRes = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `generate a job posting introduction paragraph for ${job.jobPostingWidget.employerName} in third person, under 300 words on the basis of  ${job.jobRequirement}  ${widgetData}`,
      max_tokens: 1700,
    });

    return {
      sucess: true,
      data: openaiRes.data,
    };
  } catch (err) {
    console.log(err);
    return {
      error: true,
      msg: "There is Some issue",
      err: err,
    };
  }
}
async function generateJobRequirements(job, promptOption = "") {
  // const t = `add 'A candidate ' followed by appropriate vocabulary to each line on this data  in a list form using its subheading`;
  const t = `write a list wise sentences starting each of the list with "A candidate should " followed by appropriate vocabulary for the following data especially for the responsibilities make each responsibility  a separate sub list that starts with "A candidate should" `;

  let jobRequirement = job.jobRequirement;
  let propmtText =
    promptOption.length > 0
      ? promptOption
      : `regenerate fully different content from  the content below in a formal precise manner by changing some words for similar words also remove html tags
      `;

  if (job.jobRequirement_old && job.jobRequirement_old.length > 0) {
    jobRequirement = job.jobRequirement_old;
  }
  propmtText = t;

  jobRequirement = cheerio.load(jobRequirement);

  const data2 = createKeyValuePair(cheerio.load(jobRequirement));
  const sentences = generateSentences(data2).map((t) =>
    t.replace("Skills: ", "")
  );

  // if (job.jobRequirement_old) return job.jobRequirement;
  try {
    const openaiRes = await openai.createCompletion({
      model: "gpt-3.5-turbo",
      prompt: ` ${propmtText}
      
      ${sentences.join(",")}    `,
      max_tokens: 2000,
    });

    return {
      sucess: true,
      data: openaiRes.data,
    };
  } catch (err) {
    console.log(err.response.data);
    return {
      error: true,
      msg: "There is Some issue",
      err: err,
    };
  }
}
async function generateJobRequirementByChatGPT(job) {
  let jobRequirement = job.jobRequirement;

  if (job.jobRequirement_old && job.jobRequirement_old.length > 0) {
    jobRequirement = job.jobRequirement_old;
  }

  jobRequirement = cheerio.load(jobRequirement);

  const data2 = createKeyValuePair(
    cheerio.load(
      job.jobRequirement_old ? job.jobRequirement_old : job.jobRequirement
    )
  );

  const sentences = generateSentences(data2);

  try {
    const t = `Write  the given data in list wise format with appropriate  heading and  add "The candidate must" or "the candidate should" to every sentences  , don't write any other heading`;

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: "you are helpful assistant",
        },
        {
          role: "user",
          content: `${t} ${sentences}`,
        },
      ],
    });
    const generated = completion.data.choices[0].message.content;

    return generated;
  } catch (error) {
    console.error("Error:", error.response.data);
    throw new Error("Failed to generate job requirement.");
  }
}

// Set up your OpenAI API credentials

async function generateCompletion(prompt) {
  const params = {
    engine: "text-davinci-003",
    prompt: prompt,
    maxTokens: 100,
    temperature: 0.7,
    n: 1,
    stop: "\n",
  };

  try {
    const response = await openai.complete(params);
    const completion = response.choices[0].text.trim();
    return completion;
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Failed to generate completion.");
  }
}

module.exports = {
  generateIntroduction,
  generateJobRequirements,
  generateJobRequirementByChatGPT,
};
