// utils/extractEntities.js
export function extractEntities(text) {
  // Initialize default values
  let name = null;
  let village = null;
  let district = null;
  let state = null;

  // Split text into lines and process each line
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // Iterate through lines to match patterns
  lines.forEach(line => {
    if (line.match(/Name of Claimant:/i)) {
      name = line.replace(/.*Name of Claimant:\s*/, '').trim();
    } else if (line.match(/Village:/i)) {
      village = line.replace(/.*Village:\s*/, '').trim();
    } else if (line.match(/District:/i)) {
      district = line.replace(/.*District:\s*/, '').trim();
    } else if (line.match(/State:/i)) {
      state = line.replace(/.*State:\s*/, '').trim();
    }
  });

  // Fallback: If not found in lines, try the full text with numbered format
  if (!name && text.match(/1\.\s*Name of Claimant:\s*([\w\s]+)/i)) {
    name = text.match(/1\.\s*Name of Claimant:\s*([\w\s]+)/i)[1];
  }
  if (!village && text.match(/3\.\s*Village:\s*([\w\s]+)/i)) {
    village = text.match(/3\.\s*Village:\s*([\w\s]+)/i)[1];
  }
  if (!district && text.match(/4\.\s*District:\s*([\w\s]+)/i)) {
    district = text.match(/4\.\s*District:\s*([\w\s]+)/i)[1];
  }
  if (!state && text.match(/5\.\s*State:\s*([\w\s]+)/i)) {
    state = text.match(/5\.\s*State:\s*([\w\s]+)/i)[1];
  }

  return { name, village, district, state };
}