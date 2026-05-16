/**
 * Entry point — Expo Router lands here on cold start. The root layout's
 * ProtectedRouter then redirects to the right place based on auth state,
 * so this file just kicks the user toward login as a safe default.
 */
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
