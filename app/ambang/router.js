var express = require('express');
var router = express.Router();

const { ambang, createAmbang, generateAmbang, updateAmbangById, deleteAmbangById } = require('./controller')

// const { isLoginAdmin } = require('../middleware/auth')
// router.use(isLoginAdmin)

router.get('/ambang', ambang)
router.post('/ambang', createAmbang)
router.post('/ambangs/generate', generateAmbang)
router.put('/ambang/:dusunRTRW', updateAmbangById)
router.delete('/ambang/:dusunRTRW', deleteAmbangById)

module.exports = router;