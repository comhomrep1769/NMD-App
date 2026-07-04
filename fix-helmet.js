const fs = require('fs')
const f = 'backend/src/server.ts'
let c = fs.readFileSync(f, 'utf8')
c = c.replace("import cors from 'cors';", "import cors from 'cors';\nimport helmet from 'helmet';")
c = c.replace('app.set("trust proxy", 1);', 'app.set("trust proxy", 1);\napp.use(helmet({ contentSecurityPolicy: false }));')
fs.writeFileSync(f, c, 'utf8')
console.log('Helmet added')
