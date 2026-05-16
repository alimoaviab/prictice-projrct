/**
 * Centralised public env access for the mobile client. Pulls values from
 * `app.json` -> `expo.extra` so we never hard-code URLs in components.
 *
 * To switch environments, edit app.json or pass `--env` to a build script.
 */

import Constants from 'expo-constants';

interface AppExtra {
  apiBaseUrl?: string;
  appName?: string;
}

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;

const stripTrailing = (value: string) => value.replace(/\/$/, '');

export const env = {
  apiBaseUrl: stripTrailing(extra.apiBaseUrl ?? 'https://app.eduplexo.com/api'),
  appName: extra.appName ?? 'EduPlexo',
} as const;
