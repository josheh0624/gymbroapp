export function calculateAge(month: string, day: string, year: string): number {
  if (!month || !day || !year) return 0;
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  const y = parseInt(year, 10);
  if (isNaN(m) || isNaN(d) || isNaN(y)) return 0;
  
  const today = new Date();
  const birthDate = new Date(y, m - 1, d);
  let age = today.getFullYear() - birthDate.getFullYear();
  const mDiff = today.getMonth() - birthDate.getMonth();
  
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
