import 'dotenv/config';
import { createApp } from './app';
import { env } from './lib/env';

createApp().listen(env.port, () => {
  console.log(`SpendWise API listening on http://localhost:${env.port}`);
});
