function flattenObject(obj) {
  const result = {};

  function recurse(currentObj, currentKey) {
    for (const key in currentObj) {
      const newKey = currentKey ? key : key;
      const value = currentObj[key];

      if (typeof value === "object" && !Array.isArray(value)) {
        recurse(value, newKey);
      } else {
        result[newKey] = value;
      }
    }
  }

  recurse(obj, "");

  return result;
}
function splitCamelCase(str) {
  return str.replace(/([A-Z])/g, " $1").trim();
}

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
module.exports = {
  flattenObject,
  splitCamelCase,
  capitalizeFirstLetter,
};
