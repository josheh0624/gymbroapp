const fs = require('fs');

function titleCase(str) {
  if (str === "PRS") return "PRs";
  return str.split(' ').map(word => {
    return word.charAt(0) + word.slice(1).toLowerCase();
  }).join(' ');
}

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/(label|subLabel)="([A-Z ]+)"/g, (match, p1, p2) => {
    return `${p1}="${titleCase(p2)}"`;
  });
  fs.writeFileSync(file, content, 'utf8');
}

fixFile('/Users/joshhaney/Desktop/gymbroapp/src/app/(tabs)/index.tsx');
fixFile('/Users/joshhaney/Desktop/gymbroapp/src/app/(tabs)/accountPage.tsx');
console.log('Fixed props');
