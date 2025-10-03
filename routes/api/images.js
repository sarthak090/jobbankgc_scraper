require("dotenv").config();

var express = require("express");
var router = express.Router();
const fs = require("fs");
const db = require("../../models");
const { testImageData, getImageWithTextArr } = require("../../lib/images/img2");

router.get("/", (req, res) => {
  console.log("Working");
  res.send({ message: "working" });
});

router.get("/job/:id", async (req, res) => {
  console.log("Working....");
  const job = await db.Job.findOne({ id: req.params.id });
  const format = {
    jobTitle: job.jobTitle,
    salaryText: job.jobPostingWidget.salary,
    employerName: job.jobPostingWidget.employerName,
    location: job.jobPostingWidget.joblocation,
    additionalText: "Call HR Directly for interviews ",
  };
  const data = getImageWithTextArr(format)[0];
  try {
    testImageData(data, (err, imagePath) => {
      if (err) {
        console.error("An error occurred:", err);
        res.status(500).send("Internal Server Error");
      } else {
        // Send the image as a response
        console.log(imagePath);
        res.sendFile(imagePath, (sendErr) => {
          if (sendErr) {
            console.error("Error sending file:", sendErr);
          }

          // Delete the image file
          fs.unlink(imagePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error("Error deleting file:", unlinkErr);
            }
          });
        });
      }
    });
  } catch (error) {
    console.error("An error occurred:", error);
    res.sendStatus(500);
  }
});
router.get("/:id", async (req, res) => {
  console.log("Working....");
  const job = await db.Job.findOne({ id: req.params.id });
  const format = {
    jobTitle: job.jobTitle,
    salaryText: job.jobPostingWidget.salary,
    employerName: job.jobPostingWidget.employerName,
    location: job.jobPostingWidget.joblocation,
    additionalText: "Call HR Directly for interviews ",
  };
  const data = getImageWithTextArr(format)[0];
  try {
    testImageData(data, (err, imagePath) => {
      if (err) {
        console.error("An error occurred:", err);
        res.status(500).send("Internal Server Error");
      } else {
        // Send the image as a response
        console.log(imagePath);
        res.sendFile(imagePath, (sendErr) => {
          if (sendErr) {
            console.error("Error sending file:", sendErr);
          }

          // Delete the image file
          fs.unlink(imagePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error("Error deleting file:", unlinkErr);
            }
          });
        });
      }
    });
  } catch (error) {
    console.error("An error occurred:", error);
    res.sendStatus(500);
  }
});

module.exports = router;
