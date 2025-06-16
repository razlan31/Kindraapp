// Simple menstrual cycle calculation
function calculateCyclePhase(dayOfCycle, cycleLength, periodLength = 5) {
  const ovulationDay = cycleLength - 14;
  
  if (dayOfCycle <= periodLength) {
    return 'menstrual';
  } else if (dayOfCycle === ovulationDay) {
    return 'ovulation';
  } else if (dayOfCycle >= ovulationDay - 2 && dayOfCycle <= ovulationDay + 2) {
    return 'fertile';
  } else if (dayOfCycle < ovulationDay) {
    return 'follicular';
  } else {
    return 'luteal';
  }
}

// Example for May 1-30 cycle (30 days)
const cycleLength = 30;
const ovulationDay = cycleLength - 14; // = 16

console.log('May cycle (30 days):');
console.log('Ovulation day:', ovulationDay); // Should be 16 (May 16th)
console.log('May 16th phase:', calculateCyclePhase(16, 30)); // Should be 'ovulation'
console.log('Fertile window: days', ovulationDay - 2, 'to', ovulationDay + 2); // Days 14-18