require("dotenv").config();

var express = require("express");
var router = express.Router();
const path = require("path");
const fs = require("fs/promises");

const dataFolderPath = path.join(__dirname, "../../", "data");
const linksFilePath = path.join(dataFolderPath, "links.json");
const db= require('../../models')

router.post("/", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }
const imgs = await db.FeaturedImage.find({}).limit(1)
imgs.forEach((img)=>{
  img.src=url;
  img.save()
})
   

  return res.status(201).json({ url, message: `Added Url to Img` });
});
// Read all links
router.get("/links", async (req, res) => {
  // const links = await readLinksFile();
  const imgs = await db.FeaturedImage.find({}).limit(1)
 
  return res.json(imgs);
});

// Read a specific link
router.get("/links/:id", async (req, res) => {
  const linkId = parseInt(req.params.id);
  const links = await readLinksFile();
  const link = links.find((link) => link.id === linkId);

  if (!link) {
    return res.status(404).json({ error: "Link not found" });
  }

  return res.json(link);
});

// Update a link
router.put("/links/:id", async (req, res) => {
  const linkId = parseInt(req.params.id);
  const updatedUrl = req.body.url;

  if (!updatedUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  const links = await readLinksFile();
  const link = links.find((link) => link.id === linkId);

  if (!link) {
    return res.status(404).json({ error: "Link not found" });
  }

  link.url = updatedUrl;

  await writeLinksFile(links);

  return res.json(link);
});

// Delete a link
router.delete("/links/:id", async (req, res) => {
  const linkId = parseInt(req.params.id);

  const links = await readLinksFile();
  const linkIndex = links.findIndex((link) => link.id === linkId);

  if (linkIndex === -1) {
    return res.status(404).json({ error: "Link not found" });
  }

  links.splice(linkIndex, 1);

  await writeLinksFile(links);

  return res.sendStatus(204);
});

async function readLinksFile() {
  try {
    const linksData = await fs.readFile(linksFilePath, "utf-8");
    return JSON.parse(linksData);
  } catch (error) {
    return [];
  }
}

async function writeLinksFile(links) {
  try {
    await fs.writeFile(linksFilePath, JSON.stringify(links, null, 2));
  } catch (error) {
    console.error("Error writing links file:", error);
  }
}
// writeLinksFile([
//   `https://jobbank.ai/wp-content/uploads/2023/05/JobBank-AI.jpg`,
// ]);
module.exports = router;
