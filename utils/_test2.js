const axios = require("axios");
const { Configuration, OpenAIApi } = require("openai");

const config = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});
const openai = new OpenAIApi(config);
async function generateJobRequirementByChatGPT(data) {
  try {
    const t = `Write the given data in list wise format with appropriate  heading and  add "a candidate should" to every sentences  `;

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `${t} ${data}`,
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
// Example usage
const data = [
  "Skills: Security and safety - Criminal record check, Immunization records, Reference required",
  "Skills: Transportation/travel information - Public transportation is available, Travel expenses paid by employer, Willing to travel, Willing to travel for extended periods, Willing to travel overnight, Willing to travel regularly",
  "Skills: Work conditions and physical capabilities - Bending, crouching, kneeling, Combination of sitting, standing, walking, Handling heavy loads, Overtime required, Physically demanding, Repetitive tasks, Sitting, Standing for extended periods, Walking",
  "Skills: Weight handling - Up to 45 kg (100 lbs)",
  "Skills: Personal suitability - Punctuality, Client focus, Dependability, Efficient interpersonal skills, Excellent oral communication, Flexibility, Initiative, Judgement, Organized, Reliability, Team player",
  "Languages: English",
  "Education requirements: Secondary (high) school graduation certificate",
  "Experience requirements: 1 year to less than 2 years",
  "Responsibilities: Care for pets, Administer bedside and personal care, Administer medications, Assist clients with bathing and other aspects of personal hygiene, Assist in regular exercise, e.g., walk, Assume full responsibility for household (in absence of householder), Change non-sterile dressings, Feed or assist in feeding, Perform light housekeeping and cleaning duties, Plan therapeutic diets and menus, Provide companionship, Provide personal care, Shop for food and household supplies, Prepare and serve nutritious meals",
];

// generateJobRequirement(data)
//   .then((jobRequirement) => {
//     console.log(jobRequirement);
//     // Use the generated job requirement as needed
//   })
//   .catch((error) => {
//     console.error(error);
//   });
