import packageInfo from '../../package.json';

const fallbackVersion =
  typeof packageInfo.version === 'string' && packageInfo.version.trim().length > 0
    ? packageInfo.version
    : '0.0.0';

export function getAppVersion(): string {
  return (
    process.env.NEXT_PUBLIC_EDITOR_VERSION ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    fallbackVersion
  );
}
