// versions.js
// Every version of the falling circle. The circle is always the same;
// only the sound (and when it plays) changes.
//
// sound:  which synthesised sound to play at each impact (see app.js)
// offset: seconds between the moment of contact and the sound
//         (positive = late, negative = early)
// inFilm: true for the four versions in the original Week 5 film

const VERSIONS = [
  {
    id: "01", name: "Silence", sound: "none", offset: 0, inFilm: true,
    text: "No sound at all. Most people still seem to hear something: the eye supplies a sound from memory. In the film this came first, so it set the expectation for everything after it."
  },
  {
    id: "02", name: "Dry knock", sound: "dry", offset: 0, inFilm: true,
    text: "A short, dry impact with no ring. In the film it surprised me by sounding like a plastic bottle being struck. Without a ring, the circle seems light and hollow."
  },
  {
    id: "03", name: "Ring", sound: "ring", offset: 0, inFilm: true,
    text: "A resonant tone with a long decay. The circle becomes metal or ceramic, and heavier. The sound adds a property that the image does not show."
  },
  {
    id: "04", name: "Late ring", sound: "ring", offset: 0.3, inFilm: true,
    text: "The same ring, 0.3 seconds after contact. In the film, after hearing the ring, I expected it at the moment of contact, so the delay could feel like an echo. Alone, it may feel more like a mistake."
  },
  {
    id: "05", name: "Early knock", sound: "dry", offset: -0.15, inFilm: false,
    text: "New. The dry knock arrives 0.15 seconds before contact. It tests how far a sound can move ahead of the image before it stops belonging to it."
  },
  {
    id: "06", name: "Heavy thud", sound: "thud", offset: 0, inFilm: false,
    text: "New. A low, dull thud. The circle is the same size on screen, but the sound gives it weight."
  },
  {
    id: "07", name: "Glass", sound: "glass", offset: 0, inFilm: false,
    text: "New. A bright, short ring. It tests whether the eye accepts a fragile material for a circle that bounces without breaking."
  }
];

// the answers a viewer can give
const MATERIALS = ["Rubber", "Plastic", "Wood", "Metal", "Glass", "Stone", "Not sure"];
