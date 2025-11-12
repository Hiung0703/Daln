const bcrypt = require('bcryptjs');

const testPassword = 'test123';
const hashFromDB = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

console.log('Testing bcrypt...');
console.log('Password:', testPassword);
console.log('Hash:', hashFromDB);

bcrypt.compare(testPassword, hashFromDB, (err, result) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Match:', result);
    if (!result) {
      // Generate new hash
      bcrypt.hash(testPassword, 10, (err2, newHash) => {
        if (err2) {
          console.error('Error generating hash:', err2);
        } else {
          console.log('\nNew hash for test123:');
          console.log(newHash);
        }
        process.exit(result ? 0 : 1);
      });
    } else {
      process.exit(0);
    }
  }
});
