// Dummy coords for demo - replace with real GIS / DB lookup later
const locationDB = {
  "बस्तर": { lat: 19.0745, lng: 81.9535 },
  "दंतेवाड़ा": { lat: 18.9, lng: 81.35 }
};

export const mapVillagesToCoords = (villages) => {
  return villages.map(v => ({
    name: v,
    coords: locationDB[v] || { lat: null, lng: null }
  }));
};
