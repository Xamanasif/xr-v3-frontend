const fs = require('fs');
const src = fs.readFileSync(process.argv[2], 'utf8');
class DCLogic {}
const Component = new Function('DCLogic', src + '\nreturn Component;')(DCLogic);
process.stdout.write(JSON.stringify(Component.WORLD, null, 1));
