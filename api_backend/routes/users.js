const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /friends - Get all friends
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM friends ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// GET /friends/:id - Get a friend by ID
router.get('/:id', async (req, res) => {
  const friendId = parseInt(req.params.id);
  try {
    const result = await pool.query('SELECT * FROM friends WHERE id = $1', [friendId]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Friend not found');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// POST /friends - Add a new friend
router.post('/', async (req, res) => {
  console.log('Received data:', req.body); // Log the received data

  const { first_name, last_name, age, city, state } = req.body;

  // Check if all fields are present
  if (!first_name || !last_name || age == null || !city || !state) {
    return res.status(400).send('All fields are required');
  }

  try {
    const result = await pool.query(
        'INSERT INTO friends (first_name, last_name, age, city, state) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [first_name, last_name, age, city, state]
    );
    console.log('Inserted friend:', result.rows[0]); // Log the inserted friend
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Error creating friend: ' + err.message);
  }
});

// PUT /friends/:id - Update a friend by ID
router.put('/:id', async (req, res) => {
  const friendId = parseInt(req.params.id);
  const {first_name, last_name, age, city, state } = req.body;

  if (!first_name || !last_name || age == null || !city || !state) {
    return res.status(400).send('All fields are required');
  }

  try {
    const result = await pool.query(
        'UPDATE friends SET first_name = $1, last_name = $2, age = $3, city = $4, state = $5 WHERE id = $6 RETURNING *',
        [first_name, last_name, age, city, state, friendId]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Friend not found');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// DELETE /friends/:id - Delete a friend by ID
router.delete('/:id', async (req, res) => {
  const friendId = parseInt(req.params.id);
  try {
    const result = await pool.query('DELETE FROM friends WHERE id = $1 RETURNING *', [friendId]);
    if (result.rows.length > 0) {
      res.status(204).send();
    } else {
      res.status(404).send('Friend not found');
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
