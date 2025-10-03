const gm = require("gm").subClass({ imageMagick: true });

// Path to the input image
const inputImagePath = "test.png";

// Path to the output image
const outputImagePath = "image.jpg";

// Array of text objects
const texts = [
  {
    text: "Carpenter",
    x: 900,
    y: 80,
  },

  {
    text: "CAD $29.48 hourly",
    x: 900,
    y: 150,
  },
  {
    text: "CK Flooring & Interior Ltd.",
    x: 700,
    y: 320,
  },
  {
    text: "Calgary,AB",
    x: 970,
    y: 385,
  },
  {
    text: "Call HR directly for interviews",
    x: 510,
    y: 545,
  },
];

gm(inputImagePath)
  .font("Roboto")
  .fontSize(60)
  .fill("#FFFFFF")
  .stroke("#FFFFFF", 2)
  .drawText(texts[0].x, texts[0].y, texts[0].text)

  .fontSize(30)
  .fill("#4973E4")
  .stroke("#4973E4", 1)
  .drawText(texts[1].x, texts[1].y, texts[1].text)

  .fontSize(40)
  .fill("#333333")
  .stroke("#333333", 1)
  .drawText(texts[2].x, texts[2].y, texts[2].text)

  .fontSize(38)
  .fill("#867751")
  .stroke("#867751", 1)
  .drawText(texts[3].x, texts[3].y, texts[3].text)

  .fontSize(38)
  .fill("#2A1D1E")
  .stroke("#2A1D1E", 1)
  .drawText(texts[4].x, texts[4].y, texts[4].text)

  .write(outputImagePath, (err) => {
    if (err) {
      console.error("An error occurred:", err);
    } else {
      console.log("Text added to the image!");
    }
  });
