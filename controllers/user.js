const sql = require('mssql/msnodesqlv8');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { DB_connection } = require('../DB_connect');
const { response } = require('express');
DB_connection()

const request = new sql.Request();
const secret = 'wertyjkgmhnfgshfggyhgtyhgr435yw56457u'

function check (req, res){
    res.json({success : true})
}

async function CreateEmployee(req, res) {
    try {
        const { firstName, lastName, email, gender, password } = req.body;
        if (!firstName || !lastName || !email || !gender || !password) {
            return res.json({ success: false, msg: "Missing required fields" });
        }
        if (gender !== 'male' && gender !== 'female' && gender !== 'other') {
            return res.json({ success: false, msg: "Invalid gender" });
        }
        const emailExistsQuery = `SELECT COUNT(*) AS count FROM employeesInfo WHERE email = '${email}'`;
        const emailExistsResult = await request.query(emailExistsQuery);
        if (emailExistsResult.recordset[0].count > 0) {
            return res.json({ success: false, msg: "Email already exists" });
        }
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().replace('T', ' ').replace('Z', '');
        const hashPassword = await bcrypt.hashSync(password, 10);
        const insertQuery = `INSERT INTO employeesInfo (firstName, lastName, email, gender, createTime, password) OUTPUT inserted.id VALUES ('${firstName}', '${lastName}', '${email}', '${gender}','${formattedDate}', '${hashPassword}')`;
        const insertResult = await request.query(insertQuery);
        const generatedID = insertResult.recordset[0].id;
        const token =  await jwt.sign({
            id : generatedID,
            email : email
        }, secret, {expiresIn : '60s'})
        return res.json({ success: true , token : token});
    } catch (error) {
        console.log("Create employee error:", error);
        return res.json({ success: false, msg: "Internal server error" });
    }
}

async function employeeEntry(req, res){ 
    try {
        const {id} = req.body;
        if (!id) {
            return res.json({success: false, msg: 'Employee ID is required'});
        }
        // check Id exists or not
        const checkIdQuary = `select * from employeesInfo where id = ${id}`
        const checkIdResponse = await request.query(checkIdQuary);
        console.log(checkIdResponse);   
        if(checkIdResponse.recordset.length == 0){
            console.log("invelid ID :", checkIdQuary.recordset);
            return res.json({success : false, msg : "invelid ID, please enter velid ID"})
        }
        const findIdDataQuary = `SELECT * FROM employees_Entry_exit WHERE employeeID = ${id}`;
        const findIdData = await request.query(findIdDataQuary);
        if(findIdData.recordset.length !== 0 && findIdData.recordset[findIdData.recordset.length - 1].employeeExit == null){
            console.log(findIdData.recordset[findIdData.recordset.length - 1]);
            return res.json({success : false, msg : 'you cannot do entry without exit.'})
        }
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().replace('T', ' ').replace('Z', '');
        const query = `INSERT INTO employees_Entry_exit (employeeID, employeeEntry) VALUES (${id}, '${formattedDate}')`;
        const response = await request.query(query);
        res.json({success: true});
    } catch (error) {
        console.error('Error in employeeEntry API:', error);
        res.status(500).json({success: false, msg: 'Something went wrong on the server'});
    }
}

async function employeeExit(req, res) {
    try {
        const { id } = req.body;
        const findIdDataQuary = `SELECT * FROM employees_Entry_exit WHERE employeeID = ${id}`;
        const findIdData = await request.query(findIdDataQuary);
        
        if (findIdData.recordset.length === 0) {
            return res.json({ success: false, message: 'Employee record not found' });
        }
        if(findIdData.recordset[findIdData.recordset.length - 1].employeeExit != null){
            return res.json({success : false, message : 'make new entry you can not do exit.'});
        }
        
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().replace('T', ' ').replace('Z', '');
        const lastIEntry = findIdData.recordset[findIdData.recordset.length - 1].srID;

        const updateQuary = `UPDATE employees_Entry_exit SET employeeExit = '${formattedDate}' WHERE srID = ${lastIEntry}`;
        const exitResponse = await request.query(updateQuary);

        res.json({ success: true });
    } catch (error) {
        console.log('Error in employee exit API:', error);
        res.json({ success: false, message: 'Something went wrong' });
    }
}

async function filterEmployeesInfo(req, res){
    try{
        const {year, month, day} = req.body;
        const setDate = year + '-' + month + '-' +  day
        const quary = `SELECT * FROM employees_Entry_exit WHERE CAST(employeeEntry AS DATE) = '${setDate}'`
        const data = await request.query(quary)
        const responseData = data.recordset
        res.json({success : true, data : responseData})
    } catch (error){
        console.log('filter error :', error);
        return res.json({success : false})
    }
}

async function getEmployeesEntry (req, res){
    try{
        const {id} = req.body
        if(!id){
            return res.json({success : false, msg : 'please enter ID, can not get value without ID'})
        }
        const Quary = `select * from employees_Entry_exit where employeeID = ${id}`
        const employeeData = await request.query(Quary);
        if(employeeData.recordset.length === 0){
            res.json({success : false, msg : 'employee does not have any data'})
        }
        const responseData = employeeData.recordsets
        return res.json({success : true, employeeData : responseData})
    }catch(error){
        console.log('employee entry error :', error);
        res.json({success : false, msg : 'system error'})
    }
}

async function handleLogin (req, res){
    try{
        const {email, password} = req.body
        if(!email || !password){
            return res.json({success : false, msg : 'fill all fields'})
        }
        const findEmployeeQuary = `select * from employeesInfo where email = '${email}'` 
        const findEmployeeData = await request.query(findEmployeeQuary);
        if(findEmployeeData.recordset.length === 0){
            return res.json({success : false, msg : 'invalid credentials'})
        }
        const checkPassword = bcrypt.compareSync(password, findEmployeeData.recordset[0].password)
        if(checkPassword === false){
            return res.json({success : false, msg : 'invalid credentials'})
        }
        const generatedID = findEmployeeData.recordset[0].id;
        const token =  await jwt.sign({
            id : generatedID,
            email : email
        }, secret, {expiresIn : '100s'}) // Set session duration to 100 seconds

        res.cookie('token', token, { maxAge: 100000, httpOnly: true }); // 100 seconds in milliseconds
        return res.json({success : true})
    }catch (error){
        console.log('error :', error);
        return res.json({success : false , msg : 'system error'})
    }
}

async function verifyToken(req, res) {
    try {
        const cookie = req.cookies.token;
        if (!cookie) {
            return res.send("A token is required for authentication");
        }
        
        // Remove any prefix from the cookie value
        const token = cookie.replace('token=', '');
        console.log(token);
        const decoded = jwt.verify(token, secret);
        const { id: newID, email: newEmail } = decoded;

        const expirationTimestamp = decoded.exp;
        const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
        const threshold = 30; // 30 seconds threshold for refreshing the token

        if (expirationTimestamp - currentTimestamp < threshold) {
            const newToken = jwt.sign({ id: newID, email: newEmail }, secret, { expiresIn: '100s' }); // Expires in 100 seconds
            res.cookie('token', newToken, { maxAge: 100000, httpOnly: true }); // Set the new token as a cookie (100 seconds)
            return res.json({ success: true, newToken });
        }

        return res.json({ success: true, tokenData: decoded });
    } catch (error) {
        return res.status(401).json({ success: false, msg: "Invalid Token" });
    }
};

async function addProducts(req, res) {
    try{
        const {productName, productDetails, productPrice} = req.body;
        const token = req.headers.authorization;
        const tokenData = jwt.verify(token, secret);
        const productOwnerID = tokenData.id
        if(!productOwnerID){
            return res.json({success : false, msg : 'productID is required'})
        }
        if(!productName || !productDetails || !productPrice){
            return res.json({success : false, msg : 'please enter all product details.'})
        }
        console.log('owner ID :', productDetails);

        const insertProductQuary = `insert into products (productOwnerID, productName, productDetails, productPrice) values (${productOwnerID}, '${productName}', '${productDetails}', ${productPrice})`;
        // const insertValues = [productOwnerID ,productName, productDetails, productPrice]
        const insertProduct = await request.query(insertProductQuary);
        console.log(insertProduct);
        return res.json({success : true})
    }catch (error){
        console.log('add product error :', error);
        return res.json({success : false, msg : 'system error, please try later.'})
    }
}

async function getProducts (req, res){
    try{
        const token = req.headers.authorization;
        const tokenData = jwt.verify(token, secret);
        const id = tokenData.id;
        if(!id){
            return res.json({success : false, msg : 'user ID is required'});
        }
        const getProductsQuary = `select * from products where productOwnerID = ${id}`
        const response = await request.query(getProductsQuary);
        const responseData = response.recordset
        console.log('get response :', responseData);
        return res.json({success : true, data : responseData});
    }catch (error){
        console.log("get product error :", error);
        return res.json({success : false})
    }
}

async function getAllEmployees(req, res) {
    try {
        const { page = 1, pageSize = 3 } = req.query;
        const skip = (page - 1) * pageSize;
        // Query to fetch paginated data
        const result = await request.query`SELECT * FROM employeesInfo ORDER BY Id OFFSET ${skip} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
        console.log(result);
        // Extract data from the result
        const data = result.recordset;
        // Calculate total number of records
        const totalRecords = data.length; // This can be improved based on your database engine
        // Calculate total number of pages
        const totalPages = Math.ceil(totalRecords / pageSize);
        // Construct response object
        const response = {
            data,
            pagination: {
                totalRecords,
                totalPages,
                currentPage: parseInt(page),
                pageSize: parseInt(pageSize)
            }
        };
        res.json({success : false});
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
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
    getAllEmployees
}