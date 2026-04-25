import { run } from './skills/capability-evolver-pro/handler.ts';
const result = await run({ action: 'status' });
console.log(JSON.stringify(result, null, 2));