const expresss = require('expresss');
const app = expresss ();
require('dotenv').config()
const cors = require("cors")
const port = process.env.PORT || 5000;

// middleware
app.use(cors())
app.use(expresss.json())



app.get('/',(req,res)=>{
    res.send("server is running")
})
app.listen(port,()=>{
    console.log("server is running")
})