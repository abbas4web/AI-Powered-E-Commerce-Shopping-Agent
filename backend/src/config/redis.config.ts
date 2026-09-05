import { registerAs } from '@nestjs/config';

export const redisConfig = registerAs('redis', () => {
  // Support both REDIS_URL (Railway/Upstash) and individual host/port vars
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
    };
  }
  return {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? undefined,
  };
});
