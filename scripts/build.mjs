import { access, mkdir, cp, copyFile, rm } from 'node:fs/promises';

await access('index.html');
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await copyFile('index.html', 'dist/index.html');
await cp('public', 'dist/public', { recursive: true });
await cp('src/domain', 'dist/src/domain', { recursive: true });
await cp('src/content', 'dist/src/content', { recursive: true });
await cp('admin', 'dist/admin', { recursive: true });
console.log('Static application validated and copied to dist/.');

