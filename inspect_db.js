const db = require('./config/db');

async function inspect() {
    try {
        // Elections table
        const [elections] = await db.query('SHOW COLUMNS FROM elections');
        console.log('=== ELECTIONS TABLE ===');
        elections.forEach(c => console.log(`${c.Field} | ${c.Type} | ${c.Null} | ${c.Key} | ${c.Default}`));

        // Candidates table
        const [candidates] = await db.query('SHOW COLUMNS FROM candidates');
        console.log('\n=== CANDIDATES TABLE ===');
        candidates.forEach(c => console.log(`${c.Field} | ${c.Type} | ${c.Null} | ${c.Key} | ${c.Default}`));

        // Votes table
        const [votes] = await db.query('SHOW COLUMNS FROM votes');
        console.log('\n=== VOTES TABLE ===');
        votes.forEach(c => console.log(`${c.Field} | ${c.Type} | ${c.Null} | ${c.Key} | ${c.Default}`));

        // Votes indexes
        const [voteIndexes] = await db.query('SHOW INDEX FROM votes');
        console.log('\n=== VOTES INDEXES ===');
        voteIndexes.forEach(i => console.log(`${i.Key_name} | ${i.Column_name} | ${i.Non_unique} | ${i.Seq_in_index}`));

        // Students table
        const [students] = await db.query('SHOW COLUMNS FROM students');
        console.log('\n=== STUDENTS TABLE ===');
        students.forEach(c => console.log(`${c.Field} | ${c.Type} | ${c.Null} | ${c.Key} | ${c.Default}`));

        // Users table
        const [users] = await db.query('SHOW COLUMNS FROM users');
        console.log('\n=== USERS TABLE ===');
        users.forEach(c => console.log(`${c.Field} | ${c.Type} | ${c.Null} | ${c.Key} | ${c.Default}`));

        // Clubs table
        const [clubs] = await db.query('SHOW COLUMNS FROM clubs');
        console.log('\n=== CLUBS TABLE ===');
        clubs.forEach(c => console.log(`${c.Field} | ${c.Type} | ${c.Null} | ${c.Key} | ${c.Default}`));

        // Memberships table
        const [memberships] = await db.query('SHOW COLUMNS FROM memberships');
        console.log('\n=== MEMBERSHIPS TABLE ===');
        memberships.forEach(c => console.log(`${c.Field} | ${c.Type} | ${c.Null} | ${c.Key} | ${c.Default}`));

        // Sample data
        const [electionRows] = await db.query('SELECT * FROM elections LIMIT 5');
        console.log('\n=== SAMPLE ELECTIONS ===');
        console.log(JSON.stringify(electionRows, null, 2));

        const [candidateRows] = await db.query('SELECT * FROM candidates LIMIT 5');
        console.log('\n=== SAMPLE CANDIDATES ===');
        console.log(JSON.stringify(candidateRows, null, 2));

        const [voteRows] = await db.query('SELECT * FROM votes LIMIT 5');
        console.log('\n=== SAMPLE VOTES ===');
        console.log(JSON.stringify(voteRows, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Inspection error:', err.message);
        process.exit(1);
    }
}

inspect();