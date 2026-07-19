// This file is auto-generated. Do not edit manually.

const fs = require("fs");
const path = require("path");
const { version } = require("../../../package.json");

const output = path.join(__dirname, "../../_vars/version.ts");
const buildTime = new Date().toISOString();

const content = `// This file is auto-generated. Do not edit manually.

export const VERSION = "${version}";
export const BUILD_TIME = "${buildTime}";
`;

fs.writeFileSync(output, content);

console.log("🚩 NXCTF");
console.log(`✓ Version     v${version}`);
console.log(`✓ Generated   ${path.relative(process.cwd(), output)}`);
