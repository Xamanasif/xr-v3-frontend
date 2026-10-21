// Extract the sample-world fixtures exactly as the delivered role component holds them.
// usage: node extract_fixtures.js path/to/RV.dc.html > fixtures.json
const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync(process.argv[2], 'utf8');
const start = src.indexOf('class Component extends DCLogic');
const end = src.indexOf('</script>', start);
const body = src.slice(start, end);
const sandbox = { result: null };
vm.createContext(sandbox);
vm.runInContext('class DCLogic { constructor(){ this.props = {}; this.state = {}; } setState(){} }\n' + body +
  '\nresult = { COURSES: Component.COURSES, SCOPES: Component.SCOPES, TIMES: Component.TIMES, REC: Component.REC, RB: Component.RB, REFS: Component.REFS, FN: Component.FN };', sandbox);
process.stdout.write(JSON.stringify(sandbox.result, null, 1));
