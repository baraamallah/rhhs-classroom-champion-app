const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const classes = [
  // Preschool
  { name: 'KG3A', grade: 'KG3', division: 'Pre-School' },
  { name: 'KG3B', grade: 'KG3', division: 'Pre-School' },
  { name: 'KG3C', grade: 'KG3', division: 'Pre-School' },
  { name: 'GSA', grade: 'GS', division: 'Pre-School' },

  // Elementary
  { name: 'Grade 1 ENG A', grade: 'Grade 1', division: 'Elementary' },
  { name: 'Grade 1 ENG B', grade: 'Grade 1', division: 'Elementary' },
  { name: 'Grade 1 ENG C', grade: 'Grade 1', division: 'Elementary' },
  { name: 'Grade 1 ENG D', grade: 'Grade 1', division: 'Elementary' },
  { name: 'Grade 1 FR A', grade: 'Grade 1', division: 'Elementary' },
  { name: 'Grade 2 ENG A', grade: 'Grade 2', division: 'Elementary' },
  { name: 'Grade 2 ENG B', grade: 'Grade 2', division: 'Elementary' },
  { name: 'Grade 2 ENG C', grade: 'Grade 2', division: 'Elementary' },
  { name: 'Grade 2 ENG D', grade: 'Grade 2', division: 'Elementary' },
  { name: 'Grade 2 FR A', grade: 'Grade 2', division: 'Elementary' },
  { name: 'Grade 3 ENG A', grade: 'Grade 3', division: 'Elementary' },
  { name: 'Grade 3 ENG B', grade: 'Grade 3', division: 'Elementary' },
  { name: 'Grade 3 ENG C', grade: 'Grade 3', division: 'Elementary' },
  { name: 'Grade 3 FR A', grade: 'Grade 3', division: 'Elementary' },
  { name: 'Grade 4 ENG A', grade: 'Grade 4', division: 'Elementary' },
  { name: 'Grade 4 ENG B', grade: 'Grade 4', division: 'Elementary' },
  { name: 'Grade 4 ENG C', grade: 'Grade 4', division: 'Elementary' },
  { name: 'Grade 4 FR A', grade: 'Grade 4', division: 'Elementary' },
  { name: 'Grade 5 ENG A', grade: 'Grade 5', division: 'Elementary' },
  { name: 'Grade 5 ENG B', grade: 'Grade 5', division: 'Elementary' },
  { name: 'Grade 5 ENG C', grade: 'Grade 5', division: 'Elementary' },
  { name: 'Grade 5 ENG D', grade: 'Grade 5', division: 'Elementary' },
  { name: 'Grade 5 FR A', grade: 'Grade 5', division: 'Elementary' },
  { name: 'Grade 5 FR B', grade: 'Grade 5', division: 'Elementary' },

  // Middle School
  { name: 'BE6A', grade: 'Grade 6', division: 'Middle School' },
  { name: 'BE6B', grade: 'Grade 6', division: 'Middle School' },
  { name: 'BE6C', grade: 'Grade 6', division: 'Middle School' },
  { name: 'BE6D', grade: 'Grade 6', division: 'Middle School' },
  { name: 'EB6A', grade: 'Grade 6', division: 'Middle School' },
  { name: 'AP6', grade: 'Grade 6', division: 'Middle School' },
  { name: 'BE7A', grade: 'Grade 7', division: 'Middle School' },
  { name: 'BE7B', grade: 'Grade 7', division: 'Middle School' },
  { name: 'BE7C', grade: 'Grade 7', division: 'Middle School' },
  { name: 'EB7A', grade: 'Grade 7', division: 'Middle School' },
  { name: 'AP7', grade: 'Grade 7', division: 'Middle School' },
  { name: 'BE8A', grade: 'Grade 8', division: 'Middle School' },
  { name: 'BE8B', grade: 'Grade 8', division: 'Middle School' },
  { name: 'BE8C', grade: 'Grade 8', division: 'Middle School' },
  { name: 'EB8A', grade: 'Grade 8', division: 'Middle School' },
  { name: 'EB8B', grade: 'Grade 8', division: 'Middle School' },
  { name: 'AP8', grade: 'Grade 8', division: 'Middle School' },
  { name: 'BE9A', grade: 'Grade 9', division: 'Middle School' },
  { name: 'BE9B', grade: 'Grade 9', division: 'Middle School' },
  { name: 'BE9C', grade: 'Grade 9', division: 'Middle School' },
  { name: 'EB9A', grade: 'Grade 9', division: 'Middle School' },
  { name: 'EB9B', grade: 'Grade 9', division: 'Middle School' },
  { name: 'AP9', grade: 'Grade 9', division: 'Middle School' },

  // High School
  { name: 'SE1A', grade: 'Grade 10', division: 'High School' },
  { name: 'SE1B', grade: 'Grade 10', division: 'High School' },
  { name: 'SE1C', grade: 'Grade 10', division: 'High School' },
  { name: 'ES1A', grade: 'Grade 10', division: 'High School' },
  { name: 'ES1B', grade: 'Grade 10', division: 'High School' },
  { name: 'AP10', grade: 'Grade 10', division: 'High School' },
  { name: 'Pre BF', grade: 'Grade 10', division: 'High School' },
  { name: 'SE2A', grade: 'Grade 11', division: 'High School' },
  { name: 'SE2B', grade: 'Grade 11', division: 'High School' },
  { name: 'ES2A', grade: 'Grade 11', division: 'High School' },
  { name: 'SE2H', grade: 'Grade 11', division: 'High School' },
  { name: 'Sec BF', grade: 'Grade 11', division: 'High School' },
  { name: 'Term BF', grade: 'Grade 12', division: 'High School' },
  { name: 'DP1', grade: 'Grade 11', division: 'High School' },
  { name: 'DP2', grade: 'Grade 12', division: 'High School' },
  { name: 'SE3-GS', grade: 'Grade 12', division: 'High School' },
  { name: 'SE3-LSA', grade: 'Grade 12', division: 'High School' },
  { name: 'SE3-LSB', grade: 'Grade 12', division: 'High School' },
  { name: 'SE3-LH', grade: 'Grade 12', division: 'High School' },
  { name: 'SE3-SE', grade: 'Grade 12', division: 'High School' },
  { name: 'ES3-SV', grade: 'Grade 12', division: 'High School' },
  { name: 'ES3-SE', grade: 'Grade 12', division: 'High School' },
  { name: 'AP11', grade: 'Grade 11', division: 'High School' },
  { name: 'AP12', grade: 'Grade 12', division: 'High School' },

  // Technical Institute
  { name: 'BT1-IT', grade: 'BT1', division: 'Technical Institute' },
  { name: 'BT2-IT', grade: 'BT2', division: 'Technical Institute' },
  { name: 'BT3-IT', grade: 'BT3', division: 'Technical Institute' },
  { name: 'BT1-ID', grade: 'BT1', division: 'Technical Institute' },
  { name: 'BT2-ID', grade: 'BT2', division: 'Technical Institute' }
];

const now = new Date().toISOString();

// Format exactly matching Supabase Table Editor export headers:
// id,name,grade,description,supervisor_id,is_active,created_at,division,updated_at
const rows = [
  'id,name,grade,description,supervisor_id,is_active,created_at,division,updated_at'
];

for (const c of classes) {
  const id = crypto.randomUUID();
  rows.push(`${id},${c.name},${c.grade},,,true,${now},${c.division},${now}`);
}

const targetPath = path.join(__dirname, '..', 'classrooms_import.csv');
fs.writeFileSync(targetPath, rows.join('\n'), 'utf8');
console.log(`Generated ${classes.length} rows at ${targetPath}`);
