// Test ovulation calculation for May 16th
import { format, differenceInDays } from 'date-fns';

// Simulate the cycle data from the database
const cycle = {
  id: 79,
  userId: '8',
  connectionId: 6,
  periodStartDate: new Date('2025-05-01T00:00:00.000Z'),
  periodEndDate: new Date('2025-05-05T00:00:00.000Z'),
  cycleEndDate: new Date('2025-05-30T00:00:00.000Z'),
};

// Test day: May 16th
const testDay = new Date('2025-05-16');

console.log('Testing ovulation calculation for May 16th...');
console.log('Cycle:', {
  start: format(cycle.periodStartDate, 'yyyy-MM-dd'),
  end: format(cycle.cycleEndDate, 'yyyy-MM-dd')
});

// Replicate the calendar calculation logic
const cycleStart = new Date(cycle.periodStartDate);
const cycleEnd = new Date(cycle.cycleEndDate);

// Check if day is in range
const dayInRange = testDay >= cycleStart && testDay <= cycleEnd;
console.log('Day in range:', dayInRange);

if (dayInRange) {
  // Calculate day of cycle (1-based)
  const dayOfCycle = Math.floor((testDay.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Calculate cycle length
  const cycleLength = Math.floor((cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Ovulation is 14 days before cycle end
  const ovulationDay = cycleLength - 14;
  
  console.log('Calculation results:', {
    dayOfCycle,
    cycleLength,
    ovulationDay,
    isOvulation: dayOfCycle === ovulationDay
  });
  
  // Determine phase
  const periodLength = 5; // May 1-5
  if (dayOfCycle <= periodLength) {
    console.log('Phase: menstrual');
  } else if (dayOfCycle === ovulationDay) {
    console.log('Phase: OVULATION - This should show blue circle!');
  } else if (dayOfCycle >= ovulationDay - 2 && dayOfCycle <= ovulationDay + 2) {
    console.log('Phase: fertile');
  } else if (dayOfCycle < ovulationDay) {
    console.log('Phase: follicular');
  } else {
    console.log('Phase: luteal');
  }
} else {
  console.log('Day is outside cycle range');
}