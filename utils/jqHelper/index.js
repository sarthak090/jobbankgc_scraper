const cheerio = require("cheerio");

function extractDataFromHTML(htmlString) {
  if (htmlString === null) {
    return "";
  }
  const $ = cheerio.load(htmlString);

  var wrapper = $("<div></div>");
  wrapper.html(htmlString);

  var spans = wrapper.find("span");
  var data = "";

  spans.each(function () {
    var spanId = $(this).attr("id");
    if (spanId !== "tp_applyByMail") {
      data += $(this).text().trim() + "\n";
    }
  });

  return data;
}

module.exports = {
  extractDataFromHTML,
};
