const jsonexport = require("jsonexport");
const fs = require("fs");

const data = {
  _id: "648af9bbe170c5e9d81bdc1a",
  heading: "workConditionsPhysicalCapabilities",
  sentences: [
    {
      title: "Work under pressure",
      options: [
        "The Job applicant must work under pressure and perform well. ",
        "The applicant should work under pressure and perform well. ",
        "The contestant must work under pressure and perform well. ",
        "The aspirant should work under pressure and perform well. ",
        "The competitor should work under pressure and perform well.",
      ],
      _id: "648af9bbe170c5e9d81bdc1b",
    },
    {
      title: "Handling heavy loads",
      options: [
        "Job seekers should be handling heavy loads safely.",
        "The applicant should be handling heavy loads safely.",
        "The contestant should be handling heavy loads safely.",
        "The aspirant should be handling heavy loads safely.",
        "The competitor should be handling heavy loads safely.",
      ],
      _id: "648af9bbe170c5e9d81bdc1c",
    },
  ],
  __v: 20,
};

// Extract the sentences data
const sentencesData = data.sentences.map((sentence) => ({
  heading: sentence.title,
  sentences: sentence.options.join("\n"),
}));

// Generate CSV using jsonexport
jsonexport(sentencesData, { headerPathString: "." }, (err, csv) => {
  if (err) throw err;

  fs.writeFile("sentences.csv", csv, (err) => {
    if (err) throw err;
    console.log("CSV file has been saved successfully.");
  });
});
