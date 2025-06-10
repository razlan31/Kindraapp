// Level system with 1000 levels, each requiring 100 points
export interface LevelInfo {
  level: number;
  title: string;
  pointsRequired: number;
  category: string;
}

export function getLevelInfo(points: number): LevelInfo {
  const level = Math.floor(points / 100) + 1;
  const clampedLevel = Math.min(level, 1000); // Cap at level 1000
  
  return {
    level: clampedLevel,
    title: getLevelTitle(clampedLevel),
    pointsRequired: (clampedLevel - 1) * 100,
    category: getLevelCategory(clampedLevel)
  };
}

export function getPointsInCurrentLevel(points: number): number {
  return points % 100;
}

export function getPointsToNextLevel(points: number): number {
  const currentLevel = Math.floor(points / 100) + 1;
  if (currentLevel >= 1000) return 0; // Max level reached
  return 100 - (points % 100);
}

function getLevelCategory(level: number): string {
  if (level <= 10) return "Novice";
  if (level <= 25) return "Explorer";
  if (level <= 50) return "Adventurer";
  if (level <= 100) return "Expert";
  if (level <= 200) return "Master";
  if (level <= 400) return "Grandmaster";
  if (level <= 600) return "Legend";
  if (level <= 800) return "Mythic";
  if (level <= 950) return "Transcendent";
  return "Eternal";
}

function getLevelTitle(level: number): string {
  // Novice Levels (1-10)
  if (level === 1) return "Connection Seeker";
  if (level === 2) return "First Steps";
  if (level === 3) return "Early Explorer";
  if (level === 4) return "Relationship Rookie";
  if (level === 5) return "Social Starter";
  if (level === 6) return "Bond Builder";
  if (level === 7) return "Heart Learner";
  if (level === 8) return "Emotion Tracker";
  if (level === 9) return "Memory Keeper";
  if (level === 10) return "Connection Catalyst";

  // Explorer Levels (11-25)
  if (level === 11) return "Moment Collector";
  if (level === 12) return "Intimacy Initiate";
  if (level === 13) return "Feeling Finder";
  if (level === 14) return "Trust Builder";
  if (level === 15) return "Love Linguist";
  if (level === 16) return "Relationship Researcher";
  if (level === 17) return "Connection Cultivator";
  if (level === 18) return "Heart Navigator";
  if (level === 19) return "Bond Strengthener";
  if (level === 20) return "Emotion Explorer";
  if (level === 21) return "Intimacy Investigator";
  if (level === 22) return "Memory Architect";
  if (level === 23) return "Love Cartographer";
  if (level === 24) return "Relationship Voyager";
  if (level === 25) return "Connection Connoisseur";

  // Adventurer Levels (26-50)
  if (level <= 30) return `Relationship ${["Pioneer", "Trailblazer", "Pathfinder", "Scout", "Guide"][level - 26]}`;
  if (level <= 35) return `Heart ${["Whisperer", "Healer", "Guardian", "Sage", "Oracle"][level - 31]}`;
  if (level <= 40) return `Love ${["Alchemist", "Weaver", "Sculptor", "Painter", "Composer"][level - 36]}`;
  if (level <= 45) return `Bond ${["Architect", "Engineer", "Designer", "Creator", "Innovator"][level - 41]}`;
  if (level <= 50) return `Connection ${["Virtuoso", "Maestro", "Artist", "Craftsperson", "Artisan"][level - 46]}`;

  // Expert Levels (51-100)
  if (level <= 60) return `Intimacy ${["Scholar", "Professor", "Researcher", "Theorist", "Philosopher", "Visionary", "Strategist", "Tactician", "Analyst", "Specialist"][level - 51]}`;
  if (level <= 70) return `Emotion ${["Specialist", "Expert", "Authority", "Master", "Guru", "Sensei", "Mentor", "Coach", "Advisor", "Counselor"][level - 61]}`;
  if (level <= 80) return `Memory ${["Curator", "Archivist", "Historian", "Chronicler", "Keeper", "Guardian", "Protector", "Preserver", "Collector", "Librarian"][level - 71]}`;
  if (level <= 90) return `Trust ${["Builder", "Forger", "Weaver", "Creator", "Cultivator", "Nurturer", "Developer", "Strengthener", "Reinforcer", "Establisher"][level - 81]}`;
  if (level <= 100) return `Love ${["Sage", "Mystic", "Enlightened", "Awakened", "Illuminated", "Transcendent", "Elevated", "Ascended", "Transformed", "Evolved"][level - 91]}`;

  // Master Levels (101-200)
  if (level <= 125) return `Grand ${getGrandTitle(level - 100)}`;
  if (level <= 150) return `Supreme ${getSupremeTitle(level - 125)}`;
  if (level <= 175) return `Divine ${getDivineTitle(level - 150)}`;
  if (level <= 200) return `Celestial ${getCelestialTitle(level - 175)}`;

  // Grandmaster Levels (201-400)
  if (level <= 250) return `Legendary ${getLegendaryTitle(level - 200)}`;
  if (level <= 300) return `Mythical ${getMythicalTitle(level - 250)}`;
  if (level <= 350) return `Eternal ${getEternalTitle(level - 300)}`;
  if (level <= 400) return `Infinite ${getInfiniteTitle(level - 350)}`;

  // Legend Levels (401-600)
  if (level <= 450) return `Cosmic ${getCosmicTitle(level - 400)}`;
  if (level <= 500) return `Universal ${getUniversalTitle(level - 450)}`;
  if (level <= 550) return `Omnipotent ${getOmnipotentTitle(level - 500)}`;
  if (level <= 600) return `Transcendent ${getTranscendentTitle(level - 550)}`;

  // Mythic Levels (601-800)
  if (level <= 700) return `Primordial ${getPrimordialTitle(level - 600)}`;
  if (level <= 800) return `Ethereal ${getEtherealTitle(level - 700)}`;

  // Transcendent Levels (801-950)
  if (level <= 875) return `Astral ${getAstralTitle(level - 800)}`;
  if (level <= 950) return `Dimensional ${getDimensionalTitle(level - 875)}`;

  // Eternal Levels (951-1000)
  if (level <= 1000) return `Omniscient ${getOmniscientTitle(level - 950)}`;

  return "Ultimate Being";
}

function getGrandTitle(index: number): string {
  const titles = ["Master", "Sage", "Elder", "Keeper", "Guardian", "Protector", "Champion", "Hero", "Legend", "Icon", 
                 "Paragon", "Exemplar", "Model", "Ideal", "Perfect", "Supreme", "Ultimate", "Absolute", "Pure", "Divine",
                 "Blessed", "Sacred", "Holy", "Consecrated", "Sanctified"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Evolved ${index}`;
}

function getSupremeTitle(index: number): string {
  const titles = ["Ruler", "Emperor", "Sovereign", "Monarch", "Overlord", "Commander", "Leader", "Chief", "Head", "Principal",
                 "Prime", "First", "Foremost", "Preeminent", "Paramount", "Superior", "Highest", "Greatest", "Finest", "Best",
                 "Top", "Peak", "Pinnacle", "Summit", "Apex"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Supreme ${index}`;
}

function getDivineTitle(index: number): string {
  const titles = ["Oracle", "Prophet", "Seer", "Visionary", "Mystic", "Sage", "Guru", "Master", "Teacher", "Guide",
                 "Mentor", "Advisor", "Counselor", "Healer", "Shaman", "Priest", "Monk", "Saint", "Angel", "Seraph",
                 "Cherub", "Archangel", "Avatar", "Deity", "God"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Divine ${index}`;
}

function getCelestialTitle(index: number): string {
  const titles = ["Star", "Constellation", "Galaxy", "Nebula", "Comet", "Meteor", "Aurora", "Eclipse", "Moon", "Sun",
                 "Planet", "Cosmos", "Universe", "Infinity", "Eternity", "Immortal", "Timeless", "Ageless", "Endless", "Boundless",
                 "Limitless", "Measureless", "Vast", "Immense", "Enormous"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Celestial ${index}`;
}

function getLegendaryTitle(index: number): string {
  const titles = ["Hero", "Champion", "Warrior", "Knight", "Paladin", "Crusader", "Defender", "Protector", "Guardian", "Sentinel"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Legendary ${index}`;
}

function getMythicalTitle(index: number): string {
  const titles = ["Phoenix", "Dragon", "Unicorn", "Griffin", "Pegasus", "Sphinx", "Kraken", "Leviathan", "Behemoth", "Titan"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Mythical ${index}`;
}

function getEternalTitle(index: number): string {
  const titles = ["Flame", "Light", "Dawn", "Dusk", "Night", "Day", "Season", "Cycle", "Flow", "Stream"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Eternal ${index}`;
}

function getInfiniteTitle(index: number): string {
  const titles = ["Void", "Abyss", "Chasm", "Expanse", "Reach", "Span", "Scope", "Range", "Domain", "Realm"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Infinite ${index}`;
}

function getCosmicTitle(index: number): string {
  const titles = ["Force", "Energy", "Power", "Might", "Strength", "Will", "Spirit", "Soul", "Essence", "Core"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Cosmic ${index}`;
}

function getUniversalTitle(index: number): string {
  const titles = ["Law", "Truth", "Reality", "Existence", "Being", "Consciousness", "Awareness", "Knowledge", "Wisdom", "Understanding"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Universal ${index}`;
}

function getOmnipotentTitle(index: number): string {
  const titles = ["Creator", "Destroyer", "Shaper", "Molder", "Former", "Maker", "Builder", "Architect", "Designer", "Planner"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Omnipotent ${index}`;
}

function getTranscendentTitle(index: number): string {
  const titles = ["Mind", "Thought", "Idea", "Concept", "Vision", "Dream", "Hope", "Faith", "Belief", "Trust"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Transcendent ${index}`;
}

function getPrimordialTitle(index: number): string {
  const titles = ["Origin", "Source", "Beginning", "Genesis", "Birth", "Creation", "Foundation", "Root", "Base", "Ground"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Primordial ${index}`;
}

function getEtherealTitle(index: number): string {
  const titles = ["Mist", "Fog", "Cloud", "Vapor", "Smoke", "Haze", "Shimmer", "Glow", "Radiance", "Brilliance"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Ethereal ${index}`;
}

function getAstralTitle(index: number): string {
  const titles = ["Projection", "Plane", "Dimension", "Layer", "Level", "Sphere", "Realm", "Domain", "Territory", "Region"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Astral ${index}`;
}

function getDimensionalTitle(index: number): string {
  const titles = ["Rift", "Portal", "Gateway", "Bridge", "Passage", "Corridor", "Channel", "Path", "Route", "Way"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Dimensional ${index}`;
}

function getOmniscientTitle(index: number): string {
  const titles = ["Observer", "Watcher", "Witness", "Seer", "Knower", "Understander", "Comprehender", "Perceiver", "Cognizer", "Recognizer"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Omniscient ${index}`;
}