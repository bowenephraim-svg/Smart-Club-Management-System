// models/Election.js
const db = require('../config/db');
const Candidate = require('./Candidate');
const Vote = require('./Vote');

class Election {

    // ==========================================
    // STATUS HELPERS
    // ==========================================
    static formatStatus(status, electionDate) {
        const today = new Date();
        const supplied = new Date(`${electionDate}T12:00:00`);
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const suppliedOnly = new Date(supplied.getFullYear(), supplied.getMonth(), supplied.getDate());

        // If status is explicitly stored, respect it
        if (status === 'Open') return 'Open';
        if (status === 'Closed') return 'Closed';

        // Upcoming status: derive from date if needed
        if (status === 'Upcoming') {
            if (suppliedOnly < todayOnly) return 'Closed'; // past date, still marked upcoming => effectively closed
            return 'Upcoming';
        }
        return status || 'Upcoming';
    }

    static normalize(row) {
        if (!row) return null;
        return {
            ...row,
            statusLabel: this.formatStatus(row.status, row.election_date)
        };
    }

    // ==========================================
    // GET ALL ELECTIONS (ADMIN)
    // ==========================================
    static async getAll() {
        const [rows] = await db.query(`
            SELECT
                e.*,
                c.club_name,
                (SELECT COUNT(*) FROM candidates cd WHERE cd.election_id = e.election_id) AS candidate_count,
                (SELECT COUNT(*) FROM votes v WHERE v.election_id = e.election_id) AS vote_count
            FROM elections e
            JOIN clubs c ON e.club_id = c.club_id
            ORDER BY e.election_date DESC, e.election_id DESC
        `);
        return rows.map(row => this.normalize(row));
    }

    // ==========================================
    // GET ONE ELECTION
    // ==========================================
    static async getById(id) {
        const [rows] = await db.query(`
            SELECT
                e.*,
                c.club_name,
                (SELECT COUNT(*) FROM candidates cd WHERE cd.election_id = e.election_id) AS candidate_count,
                (SELECT COUNT(*) FROM votes v WHERE v.election_id = e.election_id) AS vote_count
            FROM elections e
            JOIN clubs c ON e.club_id = c.club_id
            WHERE e.election_id = ?
        `, [id]);
        return this.normalize(rows[0]);
    }

    // ==========================================
    // CREATE ELECTION
    // ==========================================
    static async create({ club_id, title, description, election_date, status }) {
        const [result] = await db.query(`
            INSERT INTO elections (club_id, title, description, election_date, status)
            VALUES (?, ?, ?, ?, ?)
        `, [
            club_id,
            title || 'Election',
            description || null,
            election_date || null,
            status || 'Upcoming'
        ]);
        return result.insertId;
    }

    // ==========================================
    // UPDATE ELECTION
    // ==========================================
    static async update(id, { club_id, title, description, election_date, status }) {
        const [result] = await db.query(`
            UPDATE elections
            SET club_id = ?, title = ?, description = ?, election_date = ?, status = ?
            WHERE election_id = ?
        `, [club_id, title, description, election_date, status, id]);
        return result.affectedRows > 0;
    }

    // ==========================================
    // UPDATE STATUS ONLY
    // ==========================================
    static async updateStatus(id, status) {
        const [result] = await db.query(`
            UPDATE elections
            SET status = ?
            WHERE election_id = ?
        `, [status, id]);
        return result.affectedRows > 0;
    }

    // ==========================================
    // DELETE ELECTION
    // ==========================================
    static async delete(id) {
        const [result] = await db.query('DELETE FROM elections WHERE election_id = ?', [id]);
        return result.affectedRows > 0;
    }

    // ==========================================
    // SUMMARY STATS (ADMIN DASHBOARD)
    // ==========================================
    static async getStats() {
        const [rows] = await db.query(`
            SELECT
                COUNT(*) AS totalElections,
                SUM(CASE WHEN status = 'Upcoming' THEN 1 ELSE 0 END) AS upcomingCount,
                SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) AS activeCount,
                SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) AS closedCount,
                (SELECT COUNT(*) FROM candidates) AS totalCandidates,
                (SELECT COUNT(*) FROM votes) AS totalVotes
            FROM elections
        `);
        return rows[0];
    }

    static async getStatistics() {
        return this.getStats();
    }

    static async open(id) {
        return this.updateStatus(id, 'Open');
    }

    static async close(id) {
        return this.updateStatus(id, 'Closed');
    }

    // ==========================================
    // CANDIDATES (delegated to Candidate model)
    // ==========================================
    static async getCandidates(electionId) {
        return Candidate.getByElection(electionId);
    }

    static async getCandidateById(candidateId) {
        return Candidate.findById(candidateId);
    }

    static async addCandidate(electionId, studentId, position) {
        return Candidate.create(electionId, studentId, position);
    }

    static async updateCandidate(candidateId, data) {
        return Candidate.update(candidateId, data);
    }

    static async removeCandidate(candidateId) {
        return Candidate.delete(candidateId);
    }

    // ==========================================
    // ELIGIBLE STUDENTS (club members)
    // ==========================================
    static async getEligibleStudents(clubId) {
        const [rows] = await db.query(`
            SELECT s.student_id, s.admission_no, s.first_name, s.last_name, s.class
            FROM memberships m
            JOIN students s ON m.student_id = s.student_id
            WHERE m.club_id = ? AND m.status = 'Active'
            ORDER BY s.first_name ASC, s.last_name ASC
        `, [clubId]);
        return rows;
    }

    // ==========================================
    // VOTING (delegated to Vote model)
    // ==========================================
    static async hasStudentVoted(electionId, studentId) {
        return Vote.hasVoted(electionId, studentId);
    }

    // ==========================================
    // BATCHED: GET ALL ELECTION IDS A STUDENT HAS VOTED IN
    // (avoids N+1 queries in the student elections list)
    // ==========================================
    static async getVotedElectionIds(studentId) {
        const [rows] = await db.query(`
            SELECT DISTINCT election_id
            FROM votes
            WHERE student_id = ?
        `, [studentId]);
        return rows.map(r => r.election_id);
    }

    static async isEligibleVoter(studentId, clubId) {
        return Vote.isEligibleVoter(studentId, clubId);
    }

    static async castVote(electionId, candidateId, studentId) {
        return Vote.create(electionId, candidateId, studentId);
    }

    // ==========================================
    // ACTIVE ELECTIONS (for students)
    // ==========================================
    static async getActiveElections() {
        const [rows] = await db.query(`
            SELECT
                e.*,
                c.club_name,
                (SELECT COUNT(*) FROM candidates cd WHERE cd.election_id = e.election_id) AS candidate_count,
                (SELECT COUNT(*) FROM votes v WHERE v.election_id = e.election_id) AS vote_count
            FROM elections e
            JOIN clubs c ON e.club_id = c.club_id
            WHERE e.status = 'Open'
            ORDER BY e.election_date ASC, e.election_id ASC
        `);
        return rows.map(row => this.normalize(row));
    }

    // ==========================================
    // GET UPCOMING ELECTIONS
    // ==========================================
    static async getUpcoming() {
        const [rows] = await db.query(`
            SELECT
                e.*,
                c.club_name,
                (SELECT COUNT(*) FROM candidates cd WHERE cd.election_id = e.election_id) AS candidate_count,
                (SELECT COUNT(*) FROM votes v WHERE v.election_id = e.election_id) AS vote_count
            FROM elections e
            JOIN clubs c ON e.club_id = c.club_id
            WHERE e.status = 'Upcoming'
            ORDER BY e.election_date ASC, e.election_id ASC
        `);
        return rows.map(row => this.normalize(row));
    }

    // ==========================================
    // GET CLOSED ELECTIONS
    // ==========================================
    static async getClosed() {
        const [rows] = await db.query(`
            SELECT
                e.*,
                c.club_name,
                (SELECT COUNT(*) FROM candidates cd WHERE cd.election_id = e.election_id) AS candidate_count,
                (SELECT COUNT(*) FROM votes v WHERE v.election_id = e.election_id) AS vote_count
            FROM elections e
            JOIN clubs c ON e.club_id = c.club_id
            WHERE e.status = 'Closed'
            ORDER BY e.election_date DESC, e.election_id DESC
        `);
        return rows.map(row => this.normalize(row));
    }

    // ==========================================
// ALL ELECTIONS FOR STUDENTS
// Students can see every election created by admin.
// Voting eligibility is checked separately.
// ==========================================
static async getElectionsForStudent(studentId) {
    const [rows] = await db.query(`
        SELECT
            e.*,
            c.club_name,

            (
                SELECT COUNT(*)
                FROM candidates cd
                WHERE cd.election_id = e.election_id
            ) AS candidate_count,

            (
                SELECT COUNT(*)
                FROM votes v
                WHERE v.election_id = e.election_id
            ) AS vote_count

        FROM elections e

        JOIN clubs c
            ON e.club_id = c.club_id

        ORDER BY
            e.election_date DESC,
            e.election_id DESC
    `);

    return rows.map(row => this.normalize(row));
}


// ==========================================
// OPEN ELECTIONS FOR STUDENTS
// Students can see every OPEN election.
// Eligibility is checked when voting.
// ==========================================
static async getActiveElectionsForStudent(studentId) {
    const [rows] = await db.query(`
        SELECT
            e.*,
            c.club_name,

            (
                SELECT COUNT(*)
                FROM candidates cd
                WHERE cd.election_id = e.election_id
            ) AS candidate_count,

            (
                SELECT COUNT(*)
                FROM votes v
                WHERE v.election_id = e.election_id
            ) AS vote_count

        FROM elections e

        JOIN clubs c
            ON e.club_id = c.club_id

        WHERE e.status = 'Open'

        ORDER BY
            e.election_date ASC,
            e.election_id ASC
    `);

    return rows.map(row => this.normalize(row));
}

    // ==========================================
    // RESULTS & TURNOUT (delegated to Vote model)
    // ==========================================
    static async getResults(electionId) {
        return Vote.getResults(electionId);
    }

    static async getVoterTurnout(electionId) {
        return Vote.getTurnout(electionId);
    }

}

module.exports = Election;