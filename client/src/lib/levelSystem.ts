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

function getModernTitle(index: number): string {
  const titles = ["Hottie", "Snack", "Smoke Show", "Main Character", "Icon", "Legend", "Mood", "Vibe", "Energy", "Aura",
                 "It Girl", "Moment", "Slay Queen", "Boss Babe", "Fire", "Flame", "Heat", "Steam", "Spice", "Thirst Trap",
                 "Catch", "Prize", "Treasure", "Gem", "Diamond", "Star", "Queen", "Goddess", "Deity", "Supreme Being",
                 "Force of Nature", "Unstoppable", "Irresistible", "Magnetic", "Electric", "Dynamic", "Explosive", "Nuclear",
                 "Cosmic", "Galactic", "Universal", "Infinite", "Eternal", "Transcendent", "Omnipotent", "All-Powerful",
                 "Ultimate", "Maximum", "Peak Performance"];
  return titles[Math.min(index - 1, titles.length - 1)] || `Level ${index} Legend`;
}

function getLevelTitle(level: number): string {
  // Novice Levels (1-10)
  if (level === 1) return "Flirt Newbie";
  if (level === 2) return "Swipe Right Specialist";
  if (level === 3) return "Butterflies Expert";
  if (level === 4) return "Text Game Rookie";
  if (level === 5) return "First Date Survivor";
  if (level === 6) return "Spark Collector";
  if (level === 7) return "Banter Boss";
  if (level === 8) return "Chemistry Detective";
  if (level === 9) return "Heart Eyes Haver";
  if (level === 10) return "Crush Whisperer";

  // Explorer Levels (11-25)
  if (level === 11) return "Spice Seeker";
  if (level === 12) return "Vibe Checker";
  if (level === 13) return "Steam Creator";
  if (level === 14) return "Trust Fall Champion";
  if (level === 15) return "Pillow Talk Pro";
  if (level === 16) return "Secret Keeper";
  if (level === 17) return "Fire Starter";
  if (level === 18) return "Romance Hacker";
  if (level === 19) return "Tension Builder";
  if (level === 20) return "Flame Tender";
  if (level === 21) return "Soul Scanner";
  if (level === 22) return "Love Engineer";
  if (level === 23) return "Intimacy Influencer";
  if (level === 24) return "Connection Connoisseur";
  if (level === 25) return "Passion Professor";

  // Adventurer Levels (26-50)
  if (level === 26) return "Hot & Bothered";
  if (level === 27) return "Thirst Trap Master";
  if (level === 28) return "Bedroom Eyes Pro";
  if (level === 29) return "Smooth Operator";
  if (level === 30) return "Netflix & Chill Expert";
  if (level === 31) return "Dirty Mind Reader";
  if (level === 32) return "Shower Thought Genius";
  if (level === 33) return "Kiss & Tell Artist";
  if (level === 34) return "Temperature Rising";
  if (level === 35) return "Heart Rate Monitor";
  if (level === 36) return "Tension Maximizer";
  if (level === 37) return "Pulse Accelerator";
  if (level === 38) return "Sweet Talker Supreme";
  if (level === 39) return "Eye Contact Champion";
  if (level === 40) return "Touch Magician";
  if (level === 41) return "Mood Setter Extraordinaire";
  if (level === 42) return "Anticipation Builder";
  if (level === 43) return "Desire Amplifier";
  if (level === 44) return "Chemistry Reactor";
  if (level === 45) return "Spark Multiplier";
  if (level === 46) return "Steam Generator";
  if (level === 47) return "Heat Wave Creator";
  if (level === 48) return "Fire Igniter";
  if (level === 49) return "Passion Accelerator";
  if (level === 50) return "Connection Overdrive";

  // Expert Levels (51-100)
  if (level <= 60) return `Thirst ${["Professor", "PhD", "Researcher", "Theorist", "Philosopher", "Genius", "Strategist", "Master", "Expert", "Specialist"][level - 51]}`;
  if (level <= 70) return `Vibe ${["Specialist", "Expert", "Authority", "Master", "Guru", "Sensei", "Mentor", "Coach", "Advisor", "Whisperer"][level - 61]}`;
  if (level <= 80) return `Spice ${["Curator", "Collector", "Historian", "Chronicler", "Keeper", "Guardian", "Protector", "Preserver", "Hoarder", "Librarian"][level - 71]}`;
  if (level <= 90) return `Steam ${["Builder", "Creator", "Weaver", "Maker", "Cultivator", "Engineer", "Developer", "Architect", "Designer", "Producer"][level - 81]}`;
  if (level <= 100) return `Fire ${["Sage", "Mystic", "Legend", "Icon", "God", "Deity", "Supreme", "Ultimate", "Max Level", "Final Boss"][level - 91]}`;

  // Master Levels (101-200) - Keep it fun but escalate
  if (level <= 125) return `Mega ${getModernTitle(level - 100)}`;
  if (level <= 150) return `Ultra ${getModernTitle(level - 125)}`;
  if (level <= 175) return `Hyper ${getModernTitle(level - 150)}`;
  if (level <= 200) return `Legendary ${getModernTitle(level - 175)}`;

  // Higher levels keep the pattern but get more ridiculous
  if (level <= 250) return `Mythical ${getModernTitle(level - 200)}`;
  if (level <= 300) return `Godlike ${getModernTitle(level - 250)}`;
  if (level <= 400) return `Cosmic ${getModernTitle(level - 300)}`;
  if (level <= 500) return `Universal ${getModernTitle(level - 400)}`;
  if (level <= 600) return `Multiversal ${getModernTitle(level - 500)}`;
  if (level <= 700) return `Omnipotent ${getModernTitle(level - 600)}`;
  if (level <= 800) return `Transcendent ${getModernTitle(level - 700)}`;
  if (level <= 900) return `Ethereal ${getModernTitle(level - 800)}`;
  if (level <= 1000) return `Ultimate ${getModernTitle(level - 900)}`;

  return "Kindra's Chosen One";
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