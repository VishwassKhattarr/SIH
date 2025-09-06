// simple regex-based village extraction for Hindi + English
export const extractVillages = (text) => {
  const regex = /गाँव\s*([^\s,]+)/g; // finds "गाँव <name>"
  let match;
  let villages = [];

  while ((match = regex.exec(text)) !== null) {
    villages.push(match[1]);
  }

  // fallback: split by keywords
  if (villages.length === 0) {
    villages = text.split(/\s+/).filter(w => w.length > 4);
  }

  return villages;
};
