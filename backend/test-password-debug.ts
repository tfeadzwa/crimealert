import crypto from 'crypto';

// Test the hashing functions directly
const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16);
  console.log('  Salt (Buffer):', salt);
  console.log('  Salt (hex):', salt.toString('hex'));
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  console.log('  Hash:', hash.substring(0, 50) + '...');
  return salt.toString('hex') + ':' + hash;
};

const verifyPassword = (password: string, hashedPassword: string): boolean => {
  console.log('\nVerifying with hash:', hashedPassword.substring(0, 80) + '...');
  const parts = hashedPassword.split(':');
  console.log('  Parts count:', parts.length);
  const [saltHex, hash] = parts;
  console.log('  Salt (hex):', saltHex);
  console.log('  Hash from storage:', hash.substring(0, 50) + '...');
  
  const salt = Buffer.from(saltHex, 'hex');
  console.log('  Salt (Buffer):', salt);
  
  const computed = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  console.log('  Computed hash:', computed.substring(0, 50) + '...');
  console.log('  Match:', computed === hash);
  return computed === hash;
};

// Test
console.log('🔐 Password Hashing Test\n');
const password = 'admin123';
console.log('Creating hash for password:', password);
const hashed = hashPassword(password);
console.log('Final hash:', hashed.substring(0, 80) + '...\n');

console.log('Verifying password:');
const result = verifyPassword(password, hashed);
console.log('\nResult:', result ? '✅ MATCH' : '❌ NO MATCH');
