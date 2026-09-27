const fs = require('fs');
const path = require('path');

function titleCase(str) {
  return str.split(' ').map(word => {
    if (['A', 'AN', 'THE', 'AND', 'OR', 'BUT'].includes(word) && word !== str.split(' ')[0]) {
      return word.toLowerCase();
    }
    return word.charAt(0) + word.slice(1).toLowerCase();
  }).join(' ');
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Match >TEXT< or >TEXT </Text> or {routine.workout_count} WORKOUTS
      content = content.replace(/>([^<{}]+)</g, (match, p1) => {
        if (p1.trim().length > 1 && p1.toUpperCase() === p1 && /[A-Z]/.test(p1)) {
          // It's all uppercase and has at least one letter
          return '>' + titleCase(p1) + '<';
        }
        return match;
      });

      // Special case for {routine.workout_count} WORKOUTS
      content = content.replace(/\} ([A-Z ]+)</g, (match, p1) => {
        if (p1.toUpperCase() === p1 && /[A-Z]/.test(p1)) {
          return '} ' + titleCase(p1) + '<';
        }
        return match;
      });
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

walk('/Users/joshhaney/Desktop/gymbroapp/src');
console.log('Done');
