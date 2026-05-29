#!/usr/bin/env node
/**
 * Sync App Groups capability to the main app and widget bundle IDs on Apple Developer.
 * Uses the same Apple API flow as EAS Build (requires Apple login in keychain from prior `eas` use).
 *
 * After running, start a production build so EAS recreates the widget profile:
 *   eas build -p ios --profile production
 */
const path = require('path');

const APP_GROUP = 'group.com.afre92.tinyrest';
const TEAM_ID = 'NQ6AG8RHP3';
const ACCOUNT_NAME = 'afre92';
const PROJECT_NAME = 'tiny-rest';

const ENTITLEMENTS = {
  'com.apple.security.application-groups': [APP_GROUP],
};

const TARGETS = [
  { bundleIdentifier: 'com.afre92.tinyrest' },
  { bundleIdentifier: 'com.afre92.tinyrest.widget' },
];

function resolveEasCliRoot() {
  try {
    return path.dirname(require.resolve('eas-cli/package.json'));
  } catch {
    const { execSync } = require('child_process');
    const fs = require('fs');
    const easBin = fs.realpathSync(execSync('which eas', { encoding: 'utf8' }).trim());
    return path.resolve(path.dirname(easBin), '..');
  }
}

async function main() {
  const easCliRoot = resolveEasCliRoot();

  const { authenticateAsync } = require(path.join(
    easCliRoot,
    'build/credentials/ios/appstore/authenticate'
  ));
  const { ensureBundleIdExistsAsync } = require(path.join(
    easCliRoot,
    'build/credentials/ios/appstore/ensureAppExists'
  ));
  const { revokeProvisioningProfileAsync } = require(path.join(
    easCliRoot,
    'build/credentials/ios/appstore/provisioningProfile'
  ));
  const { ApplePlatform } = require(path.join(
    easCliRoot,
    'build/credentials/ios/appstore/constants'
  ));

  const authCtx = await authenticateAsync({ teamId: TEAM_ID });

  for (const { bundleIdentifier } of TARGETS) {
    await ensureBundleIdExistsAsync(
      authCtx,
      { accountName: ACCOUNT_NAME, projectName: PROJECT_NAME, bundleIdentifier },
      { entitlements: ENTITLEMENTS }
    );
  }

  const widgetBundleId = 'com.afre92.tinyrest.widget';
  console.log(`\nRevoking stale App Store profiles for ${widgetBundleId} on Apple Developer...`);
  await revokeProvisioningProfileAsync(
    authCtx,
    widgetBundleId,
    ApplePlatform.IOS
  );

  console.log(
    `\nSynced App Group "${APP_GROUP}" for:\n` +
      TARGETS.map((t) => `  - ${t.bundleIdentifier}`).join('\n') +
      `\n\nRevoked widget App Store profiles on Apple Developer.\n` +
      'Run a production build so EAS creates a new profile with App Groups:\n' +
      '  eas build -p ios --profile production\n'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
