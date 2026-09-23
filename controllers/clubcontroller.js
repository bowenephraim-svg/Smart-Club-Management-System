// controllers/clubController.js
const Club = require('../models/Club');
const Patron = require('../models/Patron');
const db = require('../config/db');

module.exports = {
    // GET /clubs
    getAllClubs: async (req, res) => {
        try {
            if (req.session?.user?.role === 'Patron') {
                return res.redirect('/patron/clubs');
            }
            const clubs = await Club.getAll();
            res.render('clubs/index', { clubs });
        } catch (err) {
            res.status(500).send("Core Cluster Error: Unable to extract clubs grid. " + err.message);
        }
    },

    // GET /clubs/details/:id
    getClubDetails: async (req, res) => {
        try {
            const clubId = parseInt(req.params.id, 10);
            const patronCtx = await Patron.getPatronContext(req);
            if (patronCtx.isPatron && !patronCtx.clubIds.includes(clubId)) {
                req.session.error_msg = 'Access denied. You can only view details for your assigned clubs.';
                return res.redirect('/patron/clubs');
            }

            const club = await Club.getById(clubId);
            if (!club) return res.status(404).render('404', { message: 'Club organization block missing.' });
            
            const roster = await Club.getRoster(clubId);
            res.render('clubs/details', { club, roster });
        } catch (err) {
            res.status(500).send("Details Processor Exception: " + err.message);
        }
    },

    // GET /clubs/add
    renderAddForm: async (req, res) => {
        try {
            const patrons = await Patron.getAll(); // Populate faculty select dropdown lists
            res.render('clubs/add', { patrons });
        } catch (err) {
            res.status(500).send("Error compiling configuration states: " + err.message);
        }
    },

    // POST /clubs/add
    processAdd: async (req, res) => {
        try {
            await Club.create(req.body);
            res.redirect('/clubs');
        } catch (err) {
            res.status(500).send("Failed to execute cluster charter insertion: " + err.message);
        }
    },

    // GET /clubs/edit/:id
    renderEditForm: async (req, res) => {
        try {
            const club = await Club.getById(req.params.id);
            if (!club) return res.status(404).send("Target club configuration matrix missing.");
            const patrons = await Patron.getAll();
            res.render('clubs/edit', { club, patrons });
        } catch (err) {
            res.status(500).send("Failed to parse structural properties: " + err.message);
        }
    },

    // POST /clubs/edit/:id
    processEdit: async (req, res) => {
        try {
            await Club.update(req.params.id, req.body);
            res.redirect('/clubs');
        } catch (err) {
            res.status(500).send("Mutation rejected at system schema layer: " + err.message);
        }
    },

    // GET /clubs/delete/:id
    processDelete: async (req, res) => {
        try {
            await Club.delete(req.params.id);
            res.redirect('/clubs');
        } catch (err) {
            res.status(500).send("Cascade processing fault: Purge halted. " + err.message);
        }
    },
    
    // CSV Downloader Tool Endpoint
    exportRosterCSV: async (req, res) => {
        try {
            const clubId = req.params.id;
            const club = await Club.getById(clubId);
            if (!club) return res.status(404).send("Target database configuration block missing.");

            const roster = await Club.getRoster(clubId);
            let csvContent = "Admission No,First Name,Last Name,Class Form,Stream,Roster Role,Join Date\n";
            
            roster.forEach(row => {
                const joinStr = new Date(row.join_date).toISOString().split('T')[0];
                csvContent += `"${row.admission_no}","${row.first_name}","${row.last_name}","${row.form}","${row.stream}","${row.role}","${joinStr}"\n`;
            });

            const fileMarker = club.club_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=roster_${fileMarker}.csv`);
            return res.status(200).send(csvContent);
        } catch (err) {
            return res.status(500).send("Report Processing Engine Error: " + err.message);
        }
    }
};