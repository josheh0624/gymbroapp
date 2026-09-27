const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const targetFile = path.resolve(
  __dirname,
  "../node_modules/expo-modules-jsi/apple/scripts/build-xcframework.sh",
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, "utf8");
  let modified = false;

  // 1. Move intermediate DerivedData to /tmp so macOS FileProvider / iCloud sync does not inject FinderInfo
  if (content.includes('DERIVED_DATA_PATH="${PACKAGE_DIR}/.DerivedData"')) {
    content = content.replace(
      'DERIVED_DATA_PATH="${PACKAGE_DIR}/.DerivedData"\nSPM_BUILD_PATH="${PACKAGE_DIR}/.build"',
      'DERIVED_DATA_PATH="${TMPDIR:-/tmp}/ExpoModulesJSI-DerivedData"\nSPM_BUILD_PATH="${TMPDIR:-/tmp}/ExpoModulesJSI-build"',
    );
    modified = true;
  }

  // 2. Disable code signing during intermediate SPM build slice
  if (!content.includes("CODE_SIGNING_ALLOWED=NO")) {
    content = content.replace(
      "CLANG_COVERAGE_MAPPING=NO \\",
      'CLANG_COVERAGE_MAPPING=NO \\\n    CODE_SIGNING_ALLOWED=NO \\\n    CODE_SIGNING_REQUIRED=NO \\\n    CODE_SIGN_IDENTITY="" \\',
    );
    modified = true;
  }

  // 3. Strip extended attributes before moving staging into slice
  if (!content.includes('xattr -cr "$staging_dir"')) {
    content = content.replace(
      'echo "$current_hash" > "${staging_dir}/.build-hash"',
      'echo "$current_hash" > "${staging_dir}/.build-hash"\n\n  xattr -cr "$staging_dir" 2>/dev/null || true',
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(targetFile, content, "utf8");
    console.log(
      "[patch-expo-modules-jsi] Successfully patched build-xcframework.sh for macOS iCloud/FileProvider compatibility.",
    );
  }

  try {
    execSync(
      'xattr -cr "' +
        path.resolve(__dirname, "../node_modules/expo-modules-jsi/apple") +
        '" 2>/dev/null || true',
    );
  } catch (e) {
    // ignore
  }
}

// 4. Ensure gymbroapp.xcodeproj/project.pbxproj has alwaysOutOfDate = 1 on RNFB script phases
const pbxprojFile = path.resolve(__dirname, '../ios/gymbroapp.xcodeproj/project.pbxproj');
if (fs.existsSync(pbxprojFile)) {
  let pbxContent = fs.readFileSync(pbxprojFile, 'utf8');
  let pbxModified = false;

  const phasesToFix = [
    '/* [CP-User] [RNFB] Core Configuration */ = {',
    '/* [CP-User] [RNFB] Crashlytics Configuration */ = {'
  ];

  for (const phaseMarker of phasesToFix) {
    const idx = pbxContent.indexOf(phaseMarker);
    if (idx !== -1) {
      const nextLines = pbxContent.slice(idx, idx + 200);
      if (!nextLines.includes('alwaysOutOfDate = 1;')) {
        pbxContent = pbxContent.replace(
          phaseMarker + '\n\t\t\tisa = PBXShellScriptBuildPhase;',
          phaseMarker + '\n\t\t\tisa = PBXShellScriptBuildPhase;\n\t\t\talwaysOutOfDate = 1;'
        );
        pbxModified = true;
      }
    }
  }

  if (pbxModified) {
    fs.writeFileSync(pbxprojFile, pbxContent, 'utf8');
    console.log('[patch-expo-modules-jsi] Patched project.pbxproj to fix RNFB ambiguous dependency warnings.');
  }
}

