const fs = require('fs')
const f = 'frontend-next/src/components/portal/PortalShell.tsx'
let c = fs.readFileSync(f, 'utf8')
const hasCRLF = c.includes('\r\n')
let w = c.replace(/\r\n/g, '\n')

// 1. Add CropModal import
if (!w.includes('CropModal')) {
  w = w.replace(
    "import { getNmdToken, getNmdAuth } from '@/lib/authStorage'",
    "import { getNmdToken, getNmdAuth } from '@/lib/authStorage'\nimport CropModal from '@/components/portal/CropModal'"
  )
  console.log('1: CropModal import added')
} else {
  console.log('1: CropModal import already exists')
}

// 2. Add cropSrc state after profileUrl state
if (!w.includes('cropSrc')) {
  w = w.replace(
    "const [profileUrl, setProfileUrl] = useState('')",
    "const [profileUrl, setProfileUrl] = useState('')\n  const [cropSrc, setCropSrc] = useState('')"
  )
  console.log('2: cropSrc state added')
} else {
  console.log('2: cropSrc state already exists')
}

// 3. Change file input handler to open crop modal
w = w.replace(
  "reader.onload = (ev) => setProfileUrl(ev.target?.result as string)",
  "reader.onload = (ev) => setCropSrc(ev.target?.result as string)"
)
console.log('3: file handler opens crop modal')

// 4. Make the avatar circle clickable - find the avatar display div
// Look for the circle div that shows the profile image
const avatarCircleOld = 'style={{ width: 80, height: 80, borderRadius: \'50%\','
if (w.includes(avatarCircleOld)) {
  w = w.replace(
    avatarCircleOld,
    "onClick={() => profileRef.current?.click()} style={{ width: 80, height: 80, borderRadius: '50%', cursor: 'pointer',"
  )
  console.log('4: avatar circle made clickable')
} else {
  // Try double quotes
  const avatarCircleOld2 = 'style={{ width: 80, height: 80, borderRadius: "50%",'
  if (w.includes(avatarCircleOld2)) {
    w = w.replace(
      avatarCircleOld2,
      'onClick={() => profileRef.current?.click()} style={{ width: 80, height: 80, borderRadius: "50%", cursor: "pointer",'
    )
    console.log('4: avatar circle made clickable (double quotes)')
  } else {
    console.log('4: MISS - avatar circle not found, searching...')
    const lines = w.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('80') && lines[i].includes('50%')) {
        console.log('  Found at line', i, ':', lines[i].trim().slice(0, 100))
      }
    }
  }
}

// 5. Add CropModal rendering before the closing of the component
// Find the last return's closing tags area - look for the profile section end
// Add CropModal right before the final closing tags
const cropModalJsx = "\n      {cropSrc && (\n        <CropModal\n          imageSrc={cropSrc}\n          onCancel={() => setCropSrc('')}\n          onCropDone={(cropped) => {\n            setProfileUrl(cropped)\n            setCropSrc('')\n          }}\n        />\n      )}\n"

// Find a good insertion point - before the last </div> or after the sidebar
if (w.includes('{/* Sidebar */}')) {
  // Insert before the main content area
  const insertTarget = '{/* Main content */}'
  if (w.includes(insertTarget)) {
    w = w.replace(insertTarget, cropModalJsx + '      ' + insertTarget)
    console.log('5: CropModal JSX added before main content')
  } else {
    // Try inserting before the very last closing tags
    const lastReturn = w.lastIndexOf('</div>\n  )\n}')
    if (lastReturn > -1) {
      w = w.slice(0, lastReturn) + cropModalJsx + '    ' + w.slice(lastReturn)
      console.log('5: CropModal JSX added before final closing')
    } else {
      console.log('5: MISS - could not find insertion point')
    }
  }
} else {
  console.log('5: MISS - no Sidebar comment found, trying alternative...')
  // Find the return statement's content div
  const lastDiv = w.lastIndexOf('    </div>\n  )\n}')
  if (lastDiv > -1) {
    w = w.slice(0, lastDiv) + cropModalJsx + '    ' + w.slice(lastDiv)
    console.log('5: CropModal JSX added (alternative)')
  }
}

const final = hasCRLF ? w.replace(/\n/g, '\r\n') : w
fs.writeFileSync(f, final, 'utf8')
console.log('PortalShell.tsx patched')
