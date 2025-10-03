// const fs = require("fs");
// const csv = require("csv-parser");
// const { updateSentenceOptions } = require("../utils/sentences/sentences");

// const results = [];
// const fileName = "workConditionsPhysicalCapabilities.csv";
// fs.createReadStream(fileName)
//   .pipe(csv())
//   .on("data", (data) => results.push(data))
//   .on("end", async () => {
//     // Process the imported data

//     const mongoFormat = results.slice(8, 9).map((result) => ({
//       heading: result.Heading,
//       sentences: result.Sentences.replaceAll("\r", "").split("\n"),
//     }));

//     mongoFormat.forEach(async (csvData) => {
//       try {
//         const isUpdated = await updateSentenceOptions({
//           heading: fileName.replace(".csv", ""),
//           sentenceTitle: csvData.heading,
//           options: csvData.sentences,
//         });
//         console.log(isUpdated);
//       } catch (err) {
//         console.log(err);
//       }
//     });
//   });
