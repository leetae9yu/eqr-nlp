export function getDartApiKey(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return env.DART_API_KEY || env.OPENDART_API_KEY || undefined;
}

export function hasDartApiKey(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(getDartApiKey(env));
}
