// models/Vote.js
const db = require('../config/db');

class Vote {

    static async hasVoted(electionId, studentId) {
        const [rows] = await db.query(`
            SELECT vote_id FROM votes
            WHERE election_id = ? AND student_id = ?
        `, [electionId, studentId]);
        return rows.length > 0;
    }

    /**
     * Eligible voters = active club members for the election's club.
     * Turnout = votes cast / eligible voters * 100
     */
    static async isEligibleVoter(studentId, clubId) {
        const [rows] = await db.query(`
            SELECT membership_id FROM memberships
            WHERE club_id = ? AND student_id = ? AND status = 'Active'
        `, [clubId, studentId]);
        return rows.length > 0;
    }

    static async create(electionId, candidateId, studentId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [electionRows] = await connection.query(
                'SELECT * FROM elections WHERE election_id = ? FOR UPDATE',
                [electionId]
            );
            if (electionRows.length === 0) {
                await connection.rollback();
                return { success: false, message: 'The election could not be found.' };
            }
            const election = electionRows[0];

            if (election.status !== 'Open') {
                await connection.rollback();
                return { success: false, message: 'Voting is not currently open for this election.' };
            }

            const [candidateRows] = await connection.query(
                'SELECT * FROM candidates WHERE candidate_id = ? AND election_id = ?',
                [candidateId, electionId]
            );
            if (candidateRows.length === 0) {
                await connection.rollback();
                return { success: false, message: 'The selected candidate is not part of this election.' };
            }

            const [memberRows] = await connection.query(
                `SELECT membership_id FROM memberships
                 WHERE club_id = ? AND student_id = ? AND status = 'Active'`,
                [election.club_id, studentId]
            );
            if (memberRows.length === 0) {
                await connection.rollback();
                return { success: false, message: 'You are not eligible to vote in this election. Active club membership is required.' };
            }

            const [existingVotes] = await connection.query(
                'SELECT vote_id FROM votes WHERE election_id = ? AND student_id = ?',
                [electionId, studentId]
            );
            if (existingVotes.length > 0) {
                await connection.rollback();
                return { success: false, message: 'You have already voted in this election.' };
            }

            await connection.query(`
                INSERT INTO votes (election_id, candidate_id, student_id, vote_time)
                VALUES (?, ?, ?, NOW())
            `, [electionId, candidateId, studentId]);

            await connection.commit();
            return { success: true };

        } catch (err) {
            await connection.rollback();

            if (err.code === 'ER_DUP_ENTRY') {
                return { success: false, message: 'You have already voted in this election.' };
            }
            console.error('Vote transaction error:', err.message);
            return { success: false, message: 'Unable to cast your vote. Please try again.' };

        } finally {
            connection.release();
        }
    }

    static async getTotalVotes(electionId) {
        const [rows] = await db.query(`
            SELECT COUNT(*) AS total FROM votes WHERE election_id = ?
        `, [electionId]);
        return Number(rows[0]?.total || 0);
    }

    static async countVotes(electionId) {
        return this.getTotalVotes(electionId);
    }

    static async getResultsByElection(electionId) {
        return this.getResults(electionId);
    }

    static async getResults(electionId) {
        const [rows] = await db.query(`
            SELECT
                cd.position,
                cd.candidate_id,
                CONCAT(s.first_name, ' ', s.last_name) AS candidate_name,
                s.admission_no,
                s.class,
                COUNT(v.vote_id) AS vote_count
            FROM candidates cd
            JOIN students s ON cd.student_id = s.student_id
            LEFT JOIN votes v ON v.candidate_id = cd.candidate_id
            WHERE cd.election_id = ?
            GROUP BY cd.candidate_id, cd.position, s.first_name, s.last_name, s.admission_no, s.class
            ORDER BY cd.position ASC, vote_count DESC, s.last_name ASC
        `, [electionId]);

        const byPosition = {};
        rows.forEach(row => {
            if (!byPosition[row.position]) byPosition[row.position] = [];
            byPosition[row.position].push(row);
        });

        const resultsByPosition = Object.keys(byPosition).map(position => {
            const candidates = byPosition[position];
            const totalVotes = candidates.reduce((sum, c) => sum + Number(c.vote_count || 0), 0);
            const withPercent = candidates.map(c => ({
                ...c,
                percentage: totalVotes > 0 ? Math.round((Number(c.vote_count || 0) / totalVotes) * 100) : 0
            }));
            const winner = totalVotes > 0 ? withPercent[0] : null;
            return {
                position,
                candidates: withPercent,
                totalVotes,
                winner
            };
        });

        const totalVotes = rows.reduce((sum, r) => sum + Number(r.vote_count || 0), 0);

        return {
            byPosition: resultsByPosition,
            totalVotes
        };
    }

    static async getTurnout(electionId) {
        const [rows] = await db.query(`
            SELECT
                (SELECT COUNT(DISTINCT student_id) FROM votes WHERE election_id = ?) AS votedCount,
                (SELECT COUNT(DISTINCT s.student_id)
                 FROM memberships m
                 JOIN students s ON m.student_id = s.student_id
                 JOIN elections e ON e.club_id = m.club_id
                 WHERE e.election_id = ? AND m.status = 'Active') AS eligibleCount
        `, [electionId, electionId]);

        const eligible = Number(rows[0].eligibleCount || 0);
        const voted = Number(rows[0].votedCount || 0);
        return {
            eligibleCount: eligible,
            votedCount: voted,
            turnoutPercentage: eligible > 0 ? Math.round((voted / eligible) * 100) : 0
        };
    }
}

module.exports = Vote;
