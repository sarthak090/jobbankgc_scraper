function formatSentences(data, mainHeading) {
  console.log({data,mainHeading})
  if (!data || !mainHeading) {
    return [];
  }
 
  return data.map((d) => ({
    heading: mainHeading,
    sentenceTitle: d.Heading,
    options: d.Sentences?.replaceAll("\r", "").split("\n"),
  }));
}
module.exports = formatSentences;
