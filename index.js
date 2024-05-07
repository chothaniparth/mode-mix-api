const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const cluster = require('cluster')
const os = require('os')
const userRouter = require('./routers/user')
require('dotenv').config()
const numCPUs = os.cpus().length

if (cluster.isMaster) {
    const numCPUs = os.cpus().length;
    console.log(`Master ${process.pid} is running`);
  
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }
  
    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died`);
    });
  } else {
    const app = express();
    
    app.use(cors())
    app.use(express.json())
    app.use(express.urlencoded({extended: false}))
    app.use(cookieParser())
    app.use(cookieParser())
    // app.use(expressSession())
    app.use('/', userRouter)

    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT} - Worker ${cluster.worker.id}`);
    });
  }
  