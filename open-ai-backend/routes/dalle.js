const {
    getExtendedImage
} = require('../controllers/dalle');


const express = require('express');

const router = express.Router();

router.post('/api/v1/dalle',getExtendedImage);

module.exports = router;