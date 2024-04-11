const fs = require('fs');
const { execSync } = require('child_process');

// Function to update the version in README.md
function updateReadmeVersion(newVersion) {
  const readmePath = './README.md';
  let readmeContent = fs.readFileSync(readmePath, 'utf8');
  // This regex matches the version number in the URLs found in your README.md
  // Adjust the regex if your URL format changes
  const versionRegex = /HTTP%20Mac%20Menu-(\d+\.\d+\.\d+)/g;
  readmeContent = readmeContent.replace(
    versionRegex,
    `HTTP%20Mac%20Menu-${newVersion}`
  );
  fs.writeFileSync(readmePath, readmeContent);
}

const type = process.argv[2]; // Expects 'patch', 'minor', or 'major'

if (!['patch', 'minor', 'major'].includes(type)) {
  console.error('Invalid version type. Use patch, minor, or major.');
  process.exit(1);
}

try {
  // Bump version
  execSync(`npm version ${type}`, { stdio: 'inherit' });
  // Get the new version number
  const newVersion = require('./package.json').version;
  // Update README.md with the new version
  updateReadmeVersion(newVersion);
  // Build and upload
  execSync('npm run dist', { stdio: 'inherit' });
  execSync('./upload.sh', { stdio: 'inherit' });
  console.log('done');
} catch (error) {
  console.error('An error occurred:', error);
}
