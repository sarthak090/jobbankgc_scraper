const gm = require("gm").subClass({ imageMagick: true });
const path = require("path");
// Path to the input image
const inputImagePath = "og_image/1_main.png";
console.log(inputImagePath);
// Path to the output image
const outputImagePath = "output/1_main.jpg";

function main({
  jobTitle = "",
  salaryText = "",
  employerName = "",
  location = "",
  additionalText = "",
}) {
  if (
    !jobTitle ||
    !salaryText ||
    !employerName ||
    !location ||
    !additionalText
  ) {
    throw new Error("provide necessary details for image to process");
    return;
  }
  // Array of text objects
  const texts = [
    {
      text: jobTitle,
      x: 880,
      y: 200,
      textColor: "#004AAD",
      fontSize: 50,
    },

    {
      text: salaryText,
      x: 888,
      y: 265,
      textColor: "#333333",
      fontSize: 25,
    },
    {
      text: employerName,
      x: 760,
      y: 380,
      textColor: "#333333",
      fontSize: 35,
    },
    {
      text: location,
      x: 1000,
      y: 420,
      textColor: "#333333",
      fontSize: 25,
    },
    {
      text: additionalText,
      x: 500,
      y: 570,
      textColor: "#E93175",
      fontSize: 30,
    },
  ];
  gm(inputImagePath)
    .font("Roboto")
    .fontSize(texts[0].fontSize)
    .fill(texts[0].textColor)
    .stroke(texts[0].textColor, 2)
    .drawText(texts[0].x, texts[0].y, texts[0].text)

    .fontSize(texts[1].fontSize)
    .fill(texts[1].textColor)
    .stroke(texts[1].textColor, 1)
    .drawText(texts[1].x, texts[1].y, texts[1].text)

    .fontSize(texts[2].fontSize)
    .fill(texts[2].textColor)
    .stroke(texts[2].textColor, 1)

    .drawText(texts[2].x, texts[2].y, texts[2].text)

    .fontSize(texts[3].fontSize)
    .fill(texts[3].textColor)
    .stroke(texts[3].textColor, 1)
    .drawText(texts[3].x, texts[3].y, texts[3].text)

    .fontSize(texts[4].fontSize)
    .fill(texts[4].textColor)
    .stroke(texts[4].textColor, 1)
    .drawText(texts[4].x, texts[4].y, texts[4].text)

    .write(outputImagePath, (err) => {
      if (err) {
        console.error("An error occurred:", err);
      } else {
        console.log("Text added to the image!");
      }
    });
}
// main({
//   jobTitle: "Carpenter",
//   salaryText: "CAD 30.00 hourly",
//   employerName: "CK Flooring & Interior Ltd.",
//   location: "Calagry,AB",
//   additionalText: "Call HR Directly for interviews ",
// });
