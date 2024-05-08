const express = require('express');
const {
    check, 
    CreateEmployee, 
    employeeEntry, 
    employeeExit, 
    filterEmployeesInfo, 
    getEmployeesEntry,
    handleLogin,
    verifyToken,
    addProducts,
    getProducts,
    getAllEmployees,
    search
} = require('../controllers/user')
const router = express.Router()

router.post('/', check);
router.post('/addEmployee', CreateEmployee);
router.post('/punchIn', employeeEntry);
router.post('/punchout', employeeExit);
router.post('/filter', filterEmployeesInfo);
router.post('/getEmployeeEntry', getEmployeesEntry);
router.post('/login', handleLogin);
router.get('/verifyToken',verifyToken);
router.post('/addProduct', addProducts);
router.get('/fetchProducts', getProducts);
router.get('/allEmployee', getAllEmployees);
router.post('/search', search)

module.exports = router;