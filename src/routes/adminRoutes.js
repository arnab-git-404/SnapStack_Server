const express = require('express');
const router = express.Router();
const { getAllUsers,getServerStats, toggleUserActivation } = require('../controllers/adminController');

router.get('/all-users' , getAllUsers );
router.get('/server-stats', getServerStats);
router.patch('/users/:userId/activation', toggleUserActivation);


module.exports = router;