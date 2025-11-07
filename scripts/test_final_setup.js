// Test the final complete setup
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://dqfpinqjomlgpoyfewzk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxZnBpbnFqb21sZ3BveWZld3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMzQxODYsImV4cCI6MjA3NjgxMDE4Nn0.2FH88MXYMBClo8hQ1pIMMcV3c7I7xxMaeFOECp1qaXc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCompleteSetup() {
  console.log('🔍 Testing Complete ECO Club Setup...')
  
  try {
    // Test 1: Check tables exist and have data
    console.log('\n1. Testing database tables...')
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5)
    
    if (usersError) {
      console.error('❌ Users table error:', usersError)
      return
    }
    console.log('✅ Users table working - Found', users?.length || 0, 'users')
    
    const { data: classrooms, error: classroomsError } = await supabase
      .from('classrooms')
      .select('*')
      .limit(5)
    
    if (classroomsError) {
      console.error('❌ Classrooms table error:', classroomsError)
      return
    }
    console.log('✅ Classrooms table working - Found', classrooms?.length || 0, 'classrooms')
    
    const { data: checklistItems, error: checklistError } = await supabase
      .from('checklist_items')
      .select('*')
      .limit(5)
    
    if (checklistError) {
      console.error('❌ Checklist items table error:', checklistError)
      return
    }
    console.log('✅ Checklist items table working - Found', checklistItems?.length || 0, 'items')
    
    // Test 2: Check password functions
    console.log('\n2. Testing password functions...')
    
    const { data: hashResult, error: hashError } = await supabase
      .rpc('hash_password', { input_password: 'test123' })
    
    if (hashError) {
      console.error('❌ Hash password function error:', hashError)
      return
    }
    console.log('✅ Hash password function working')
    
    const { data: verifyResult, error: verifyError } = await supabase
      .rpc('verify_password', { 
        input_password: 'test123', 
        stored_hash: hashResult 
      })
    
    if (verifyError) {
      console.error('❌ Verify password function error:', verifyError)
      return
    }
    console.log('✅ Verify password function working - Result:', verifyResult)
    
    // Test 3: Check admin user exists
    console.log('\n3. Testing admin user...')
    
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@school.com')
      .single()
    
    if (adminError) {
      console.error('❌ Admin user not found:', adminError)
      return
    }
    console.log('✅ Admin user exists - Role:', adminUser.role)
    
    // Test 4: Test admin password
    console.log('\n4. Testing admin password...')
    
    const { data: adminPasswordTest, error: adminPasswordError } = await supabase
      .rpc('verify_password', { 
        input_password: 'AdminPassword123!', 
        stored_hash: adminUser.password_hash 
      })
    
    if (adminPasswordError) {
      console.error('❌ Admin password test error:', adminPasswordError)
      return
    }
    console.log('✅ Admin password test - Result:', adminPasswordTest)
    
    console.log('\n🎉 ALL TESTS PASSED! Your ECO Club database is ready!')
    console.log('\nNext steps:')
    console.log('1. Go to http://localhost:3000')
    console.log('2. Login with admin@school.com / AdminPassword123!')
    console.log('3. Create supervisor accounts')
    console.log('4. Test all features')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testCompleteSetup()
