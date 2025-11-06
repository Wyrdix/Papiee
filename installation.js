import { execSync } from 'child_process';

console.log('Starting installation.js ...');

console.log('Generating src/lib/cnl/cnl_tactic_specifier.ts from grammar file ...');
execSync('nearleyc src/lib/cnl/cnl_tactic_specifier.ne -o src/lib/cnl/cnl_tactic_specifier.ts');
console.log('Generation done \n');
