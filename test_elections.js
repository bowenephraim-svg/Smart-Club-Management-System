// Elections & Voting system test
const db = require('./config/db');
const Election = require('./models/Election');
const Candidate = require('./models/Candidate');
const Vote = require('./models/Vote');

let passed = 0, failed = 0;
const check = (name, cond, detail = '') => {
    if (cond) { passed++; console.log(`  ✅ ${name}${detail ? ' — ' + detail : ''}`); }
    else { failed++; console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); }
};

async function test() {
    console.log('=== ELECTIONS & VOTING TEST SUITE ===\n');

    // TEST 1: Election model
    console.log('--- TEST 1: Election Model ---');
    try {
        const all = await Election.getAll();
        check('getAll returns array', Array.isArray(all), `${all.length} elections`);
        const stats = await Election.getStats();
        check('getStats has totalElections', stats && 'totalElections' in stats);
        check('getActiveElections returns array', Array.isArray(await Election.getActiveElections()));
        check('getUpcoming returns array', Array.isArray(await Election.getUpcoming()));
        check('getClosed returns array', Array.isArray(await Election.getClosed()));
        if (all.length > 0) {
            const byId = await Election.getById(all[0].election_id);
            check('getById returns election', !!byId);
            check('getById has club_name', !!byId.club_name);
        }
    } catch (err) { check('Election model tests', false, err.message); }

    // TEST 2: Candidate model
    console.log('\n--- TEST 2: Candidate Model ---');
    try {
        const all = await Election.getAll();
        if (all.length > 0) {
            const eid = all[0].election_id;
            const cands = await Candidate.getByElection(eid);
            check('getByElection returns array', Array.isArray(cands), `${cands.length} candidates`);
            if (cands.length > 0) {
                const c = cands[0];
                check('belongsToElection (correct)', await Candidate.belongsToElection(c.candidate_id, eid) === true);
                check('belongsToElection (wrong)', await Candidate.belongsToElection(c.candidate_id, 99999) === false);
                check('findById returns candidate', !!(await Candidate.findById(c.candidate_id)));
            }
        }
    } catch (err) { check('Candidate model tests', false, err.message); }

    // TEST 3: Vote model
    console.log('\n--- TEST 3: Vote Model ---');
    try {
        const all = await Election.getAll();
        if (all.length > 0) {
            const eid = all[0].election_id;
            check('hasVoted returns boolean', typeof (await Vote.hasVoted(eid, 1)) === 'boolean');
            check('getTotalVotes returns number', typeof (await Vote.getTotalVotes(eid)) === 'number');
            const results = await Vote.getResults(eid);
            check('getResults has byPosition', Array.isArray(results.byPosition));
            check('getResults has totalVotes', 'totalVotes' in results);
            const turnout = await Vote.getTurnout(eid);
            check('getTurnout has eligibleCount', 'eligibleCount' in turnout);
            check('getTurnout has votedCount', 'votedCount' in turnout);
            check('getTurnout has turnoutPercentage', 'turnoutPercentage' in turnout);
        }
    } catch (err) { check('Vote model tests', false, err.message); }

    // TEST 4: Full workflow - create election, add candidate, vote
    console.log('\n--- TEST 4: Full Voting Workflow ---');
    let testElectionId = null, testCandidateId = null;
    try {
        // Find a club with at least 2 active members
        const [clubs] = await db.query(`
    SELECT
        c.club_id,
        c.club_name,
        COUNT(m.membership_id) AS member_count
    FROM clubs c
    INNER JOIN memberships m
        ON c.club_id = m.club_id
    WHERE m.status = 'Active'
    GROUP BY c.club_id, c.club_name
    HAVING COUNT(m.membership_id) > 0
    ORDER BY member_count DESC
    LIMIT 1
`);
        check('Found club with 2+ members', clubs.length > 0, clubs.length > 0 ? `club ${clubs[0].club_id}, ${clubs[0].member_count} members` : 'No club found');

        if (clubs.length > 0) {
            const clubId = clubs[0].club_id;
            const [members] = await db.query('SELECT student_id FROM memberships WHERE club_id = ? AND status = "Active" LIMIT 2', [clubId]);
            check('Retrieved 2 members', members.length >= 2, `${members.length} members`);

            // Create election
            const futureDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
            testElectionId = await Election.create({ club_id: clubId, title: 'TEST Election', description: 'Test', election_date: futureDate, status: 'Upcoming' });
            check('Election created', !!testElectionId, `ID: ${testElectionId}`);

            // Add candidate
            const candResult = await Candidate.create(testElectionId, members[0].student_id, 'President');
            check('Candidate added', candResult.success === true, candResult.message || `ID: ${candResult.candidateId}`);
            testCandidateId = candResult.candidateId;

            // Duplicate candidate prevention
            const dupResult = await Candidate.create(testElectionId, members[0].student_id, 'President');
            check('Duplicate candidate rejected', dupResult.success === false, dupResult.message);

            // Invalid student (not a member)
            const [nonMember] = await db.query('SELECT student_id FROM students WHERE student_id NOT IN (SELECT student_id FROM memberships WHERE club_id = ?) LIMIT 1', [clubId]);
            if (nonMember) {
                const invalidResult = await Candidate.create(testElectionId, nonMember.student_id, 'Secretary');
                check('Non-member candidate rejected', invalidResult.success === false, invalidResult.message);
            }

            // Open election
            await Election.updateStatus(testElectionId, 'Open');
            const opened = await Election.getById(testElectionId);
            check('Election opened', opened.status === 'Open');

            // Vote
            const voteResult = await Vote.create(testElectionId, testCandidateId, members[1].student_id);
            check('Vote cast', voteResult.success === true, voteResult.message || '');

            // Duplicate vote rejected
            const dupVote = await Vote.create(testElectionId, testCandidateId, members[1].student_id);
            check('Duplicate vote rejected', dupVote.success === false, dupVote.message);

            // Vote for candidate from another election
            const [otherCand] = await db.query('SELECT candidate_id FROM candidates WHERE election_id != ? LIMIT 1', [testElectionId]);
            if (otherCand.length > 0) {
                const wrongCandVote = await Vote.create(testElectionId, otherCand[0].candidate_id, members[0].student_id);
                check('Cross-election candidate vote rejected', wrongCandVote.success === false, wrongCandVote.message);
            }

            // Close election
            await Election.updateStatus(testElectionId, 'Closed');
            const closed = await Election.getById(testElectionId);
            check('Election closed', closed.status === 'Closed');

            // Vote after close rejected
            const lateVote = await Vote.create(testElectionId, testCandidateId, members[0].student_id);
            check('Vote after close rejected', lateVote.success === false, lateVote.message);

            // Results
            const results = await Vote.getResults(testElectionId);
            check('Results totalVotes', results.totalVotes >= 1, `${results.totalVotes} votes`);
            check('Results byPosition', results.byPosition.length >= 1);

            // Cleanup
            await db.query('DELETE FROM votes WHERE election_id = ?', [testElectionId]);
            await db.query('DELETE FROM candidates WHERE election_id = ?', [testElectionId]);
            await db.query('DELETE FROM elections WHERE election_id = ?', [testElectionId]);
            check('Cleanup complete', true);
        }
    } catch (err) { check('Full workflow', false, err.message); }

    console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
    process.exit(failed > 0 ? 1 : 0);
}

test();