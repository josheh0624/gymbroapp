const { withXcodeProject } = require('expo/config-plugins');

module.exports = function withDevLauncherFix(config) {
  return withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const buildPhases = xcodeProject.hash.project.objects.PBXShellScriptBuildPhase || {};
    
    for (const key in buildPhases) {
      const phase = buildPhases[key];
      if (typeof phase === 'object' && phase.name && phase.name.includes('[Expo Dev Launcher] Strip Local Network Keys for Release')) {
        // Xcode 15+ requires this for script phases without inputs/outputs
        phase.alwaysOutOfDate = "1";
      }
    }
    
    return config;
  });
};
