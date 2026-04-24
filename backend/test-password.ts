import crypto from 'crypto';

const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = (password: string, hashedPassword: string): boolean => {
  const [salt, hash] = hashedPassword.split(':');
  if (!salt || !hash) {
    console.log('❌ Invalid hash format:', hashedPassword);
    return false;
  }
  const computed = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  console.log('Salt:', salt);
  console.log('Stored hash:', hash);
  console.log('Computed hash:', computed);
  console.log('Match:', computed === hash);
  return computed === hash;
};

// Test
const testPassword = 'admin123';
const hashed = hashPassword(testPassword);
console.log('\n🔐 Testing password hashing:');
console.log('Original password:', testPassword);
console.log('Hashed password:', hashed);
console.log('\n✓ Verification result:', verifyPassword(testPassword, hashed));
