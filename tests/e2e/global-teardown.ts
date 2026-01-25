import fs from 'fs'
import path from 'path'

async function globalTeardown() {
  console.log('🧹 Cleaning up E2E test environment...')

  try {
    // Delete auth storage file
    const authPath = path.join(__dirname, '.auth/user.json')
    if (fs.existsSync(authPath)) {
      fs.unlinkSync(authPath)
      console.log('✅ Deleted auth storage file')
    }
  } catch (error) {
    console.error('❌ Failed to clean up E2E environment:', error)
  }

  console.log('✅ E2E test environment cleaned up!')
}

export default globalTeardown
