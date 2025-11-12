const { runMigration } = require('./initial');

runMigration().then(() => {
    console.log('Migration thành công');
    process.exit(0);
}).catch(err => {
    console.error('Migration thất bại:', err);
    process.exit(1);
});