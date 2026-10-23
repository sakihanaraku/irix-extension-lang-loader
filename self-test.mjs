// self-test.mjs —— 校验 lang-format 解析器与三份语言包
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { parseLangFile, parseLangText, ERR_CORRUPT } = require('./lang-format');

let failed = 0;
function check(name, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failed++;
}

for (const code of ['zh', 'ja', 'en']) {
  const file = path.join(__dirname, 'lang', `${code}.lang`);
  try {
    const lang = parseLangFile(file);
    check(`${code}.lang parse`, lang.code && Object.keys(lang.strings).length > 300,
      `${lang.name} / ${Object.keys(lang.strings).length} strings`);
  } catch (err) {
    check(`${code}.lang parse`, false, err.message);
  }
}

try {
  parseLangFile(path.join(__dirname, 'lang', 'broken.lang'));
  check('broken.lang rejected', false, 'unexpected success');
} catch (err) {
  check('broken.lang rejected', err.message === ERR_CORRUPT, err.message);
}

try {
  parseLangText('@format=irix-lang-v1\n@code=ja\n@name=X\nbad key=x\n');
  check('invalid key rejected', false);
} catch (err) {
  check('invalid key rejected', err.message === ERR_CORRUPT, err.message);
}

console.log(failed ? `\n${failed} failed` : '\nall passed');
process.exit(failed ? 1 : 0);
