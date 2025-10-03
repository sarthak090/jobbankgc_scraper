const gm = require("gm").subClass({ imageMagick: true });
const path = require("path");
// Path to the input image
const inputImagePath = path.join(__dirname, "og_image", "2_main.png");

// Path to the output image
const outputImagePath = path.join(
  __dirname,

  "output",
  "2_main.webp"
);
const util = require("util");

const gmToBuffer = util.promisify(gm().toBuffer.bind(gm()));
function getImageWithTextArr({
  jobTitle = "",
  salaryText = "",
  employerName = "",
  location = "",
  additionalText = "",
}) {
  const imgsWithTextData = [
    {
      imageInputPath: "og_image/1_main.png",
      imageOutputPath: "output/1_main.png",
      texts: [
        {
          text: jobTitle,
          x: 750,
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
      ],
    },
    {
      imageInputPath: "og_image/2_main.png",
      imageOutputPath: "output/2_main.png",
      texts: [
        {
          text: jobTitle,
          x: 150,
          y: 190,
          textColor: "#004AAD",
          fontSize: 50,
        },

        {
          text: salaryText,
          x: 165,
          y: 265,
          textColor: "#333333",
          fontSize: 25,
        },
        {
          text: employerName,
          x: 180,
          y: 380,
          textColor: "#333333",
          fontSize: 35,
        },
        {
          text: location,
          x: 189,
          y: 440,
          textColor: "#333333",
          fontSize: 25,
        },
        {
          text: additionalText,
          x: 220,
          y: 570,
          textColor: "#E93175",
          fontSize: 30,
        },
      ],
    },
    {
      imageInputPath: "og_image/3_main.png",
      imageOutputPath: "output/3_main.png",
      texts: [
        {
          text: jobTitle,
          x: 150,
          y: 190,
          textColor: "#004AAD",
          fontSize: 50,
        },

        {
          text: salaryText,
          x: 165,
          y: 265,
          textColor: "#333333",
          fontSize: 25,
        },
        {
          text: employerName,
          x: 180,
          y: 380,
          textColor: "#333333",
          fontSize: 35,
        },
        {
          text: location,
          x: 189,
          y: 440,
          textColor: "#333333",
          fontSize: 25,
        },
        {
          text: additionalText,
          x: 220,
          y: 570,
          textColor: "#E93175",
          fontSize: 30,
        },
      ],
    },
  ];
  return imgsWithTextData;
}
function testImageData(data, callback) {
  const inputImagePath = path.join(
    __dirname,

    data.imageInputPath
  );
  const outputImagePath = path.join(
    __dirname,

    data.imageOutputPath
  );
  data.imageOutputPath;
  const texts = data.texts;

  gm(inputImagePath)
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
        callback(err);
      } else {
        console.log("Text added to the image!");
        callback(null, outputImagePath);
      }
    });

  // .write(outputImagePath, (err) => {
  //   if (err) {
  //     console.error("An error occurred:", err);
  //   } else {
  //     console.log("Text added to the image!");
  //   }
  // })
}

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
      x: 150,
      y: 190,
      textColor: "#004AAD",
      fontSize: 50,
    },

    {
      text: salaryText,
      x: 165,
      y: 265,
      textColor: "#333333",
      fontSize: 25,
    },
    {
      text: employerName,
      x: 180,
      y: 380,
      textColor: "#333333",
      fontSize: 35,
    },
    {
      text: location,
      x: 189,
      y: 440,
      textColor: "#333333",
      fontSize: 25,
    },
    {
      text: additionalText,
      x: 220,
      y: 570,
      textColor: "#E93175",
      fontSize: 30,
    },
  ];
  gm(inputImagePath)
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
// const format = {
//   jobTitle: "job.jobTitle",
//   salaryText: "job.jobPostingWidget.salary",
//   employerName: "job.jobPostingWidget.employerName",
//   location: "job.jobPostingWidget.joblocation",
//   additionalText: "Call HR Directly for interviews ",
// };
// main(format);

// testImageData(getImageWithTextArr(format)[1]);

module.exports = { main, testImageData, getImageWithTextArr };
