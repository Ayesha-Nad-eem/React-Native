import { Redirect } from 'expo-router';

export default function Index() {
  // Use a declarative Redirect so the router will navigate when it's ready.
  // This avoids imperative navigation before the root layout mounts.
  return <Redirect href="/(tabs)/home" />;
}
