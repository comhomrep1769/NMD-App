const fs = require('fs')
const f = 'backend/src/routes/employees.ts'
const c = fs.readFileSync(f, 'utf8')
console.log('Has avatar:', c.includes('avatar'))
console.log('Has profile_image:', c.includes('profile_image'))
console.log('Has profileImageUrl:', c.includes('profileImageUrl'))
console.log('File length:', c.length)
console.log('Resolved path:', require('path').resolve(f))
