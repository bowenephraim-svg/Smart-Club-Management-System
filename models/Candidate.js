// models/Candidate.js
const db = require('../config/db');

class Candidate {

    static async getByElection(electionId) {
        const [rows] = await db.query(`
            SELECT
                cd.candidate_id,
                cd.election_id,
                cd.student_id,
                cd.position,
                s.admission_no,
                s.first_name,
                s.last_name,
                s.class,
                CONCAT(s.first_name, ' ', s.last_name) AS candidate_name,
                (SELECT COUNT(*) FROM votes v WHERE v.candidate_id = cd.candidate_id) AS vote_count
            FROM candidates cd
            JOIN students s ON cd.student_id = s.student_id
            WHERE cd.election_id = ?
            ORDER BY cd.position ASC, s.last_name ASC
        `, [electionId]);
        return rows;
    }

    static async findById(candidateId) {
        const [rows] = await db.query(`
            SELECT
                cd.*,
                s.admission_no,
                s.first_name,
                s.last_name,
                s.class,
                CONCAT(s.first_name, ' ', s.last_name) AS candidate_name
            FROM candidates cd
            JOIN students s ON cd.student_id = s.student_id
            WHERE cd.candidate_id = ?
        `, [candidateId]);
        return rows[0] || null;
    }

    static async create(electionId, studentId, position) {
        // Verify the student is an active member of the election's club
        const [electionRows] = await db.query(`
            SELECT club_id FROM elections WHERE election_id = ?
        `, [electionId]);
        if (electionRows.length === 0) {
            return { success: false, message: 'The election could not be found.' };
        }
        const clubId = electionRows[0].club_id;

        const [memberRows] = await db.query(`
            SELECT membership_id FROM memberships
            WHERE club_id = ? AND student_id = ? AND status = 'Active'
        `, [clubId, studentId]);
        if (memberRows.length === 0) {
            return { success: false, message: 'This student is not an active member of the election\'s club and cannot be a candidate.' };
        }

        const [dupRows] = await db.query(`
            SELECT candidate_id FROM candidates
            WHERE election_id = ? AND student_id = ? AND position = ?
        `, [electionId, studentId, position]);
        if (dupRows.length > 0) {
            return { success: false, message: 'This student is already a candidate for this position in this election.' };
        }

        const [dupAnyRows] = await db.query(`
            SELECT candidate_id FROM candidates
            WHERE election_id = ? AND student_id = ?
        `, [electionId, studentId]);
        if (dupAnyRows.length > 0) {
            return { success: false, message: 'This student is already running in this election.' };
        }

        const [result] = await db.query(`
            INSERT INTO candidates (election_id, student_id, position)
            VALUES (?, ?, ?)
        `, [electionId, studentId, position]);
        return { success: true, candidateId: result.insertId };
    }

    static async update(candidateId, { student_id, position }) {
        // Verify the new student is an active member of the election's club
        const [candidateRows] = await db.query(`
            SELECT election_id FROM candidates WHERE candidate_id = ?
        `, [candidateId]);
        if (candidateRows.length === 0) {
            return false;
        }
        const electionId = candidateRows[0].election_id;

        const [electionRows] = await db.query(`
            SELECT club_id FROM elections WHERE election_id = ?
        `, [electionId]);
        if (electionRows.length === 0) {
            return false;
        }
        const clubId = electionRows[0].club_id;

        const [memberRows] = await db.query(`
            SELECT membership_id FROM memberships
            WHERE club_id = ? AND student_id = ? AND status = 'Active'
        `, [clubId, student_id]);
        if (memberRows.length === 0) {
            return false;
        }

        const [result] = await db.query(`
            UPDATE candidates
            SET student_id = ?, position = ?
            WHERE candidate_id = ?
        `, [student_id, position, candidateId]);
        return result.affectedRows > 0;
    }

    static async delete(candidateId) {
        const [result] = await db.query(`
            DELETE FROM candidates WHERE candidate_id = ?
        `, [candidateId]);
        return result.affectedRows > 0;
    }

    static async getVoteCounts(electionId) {
        const [rows] = await db.query(`
            SELECT
                cd.candidate_id,
                cd.position,
                CONCAT(s.first_name, ' ', s.last_name) AS candidate_name,
                COUNT(v.vote_id) AS vote_count
            FROM candidates cd
            JOIN students s ON cd.student_id = s.student_id
            LEFT JOIN votes v ON v.candidate_id = cd.candidate_id
            WHERE cd.election_id = ?
            GROUP BY cd.candidate_id, cd.position, s.first_name, s.last_name
            ORDER BY cd.position ASC, vote_count DESC
        `, [electionId]);
        return rows;
    }

    static async belongsToElection(candidateId, electionId) {
        const [rows] = await db.query(`
            SELECT candidate_id FROM candidates
            WHERE candidate_id = ? AND election_id = ?
        `, [candidateId, electionId]);
        return rows.length > 0;
    }
}

module.exports = Candidate;
