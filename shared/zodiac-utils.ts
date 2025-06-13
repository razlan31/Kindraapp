export function calculateZodiacSign(birthday: Date | string): string {
  const date = typeof birthday === 'string' ? new Date(birthday) : birthday;
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();
  
  // Zodiac sign date ranges
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Pisces';
  
  return '';
}

export function getZodiacElement(zodiacSign: string): string {
  const elements: Record<string, string> = {
    'Aries': 'Fire', 'Leo': 'Fire', 'Sagittarius': 'Fire',
    'Taurus': 'Earth', 'Virgo': 'Earth', 'Capricorn': 'Earth',
    'Gemini': 'Air', 'Libra': 'Air', 'Aquarius': 'Air',
    'Cancer': 'Water', 'Scorpio': 'Water', 'Pisces': 'Water'
  };
  
  return elements[zodiacSign] || '';
}

export function isZodiacCompatible(sign1: string, sign2: string): boolean {
  const element1 = getZodiacElement(sign1);
  const element2 = getZodiacElement(sign2);
  
  // Compatible combinations: Fire+Air, Earth+Water, Same Element
  return (
    (element1 === 'Fire' && element2 === 'Air') ||
    (element1 === 'Air' && element2 === 'Fire') ||
    (element1 === 'Earth' && element2 === 'Water') ||
    (element1 === 'Water' && element2 === 'Earth') ||
    (element1 === element2)
  );
}