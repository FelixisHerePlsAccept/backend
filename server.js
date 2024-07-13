const express = require('express')
const mysql = require('mysql')
const cors = require('cors')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const port = process.env.PORT || 4000

const app = express()
app.use(cors())
app.use(express.json( {limit: '50mb'} ));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'))

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        return cb(null, "./public/images")
    },
    filename: function (req, file, cb) {
        return cb(null, file.originalname)
    }
})

var online_hostname = "kml.h.filess.io";
var online_database = "maiwebusaito_porchmenbe";
var online_port = "3307";
var online_username = "maiwebusaito_porchmenbe";
var online_password = "4dd9289fb82348abb8584d0fc4b29f6a0bc052e9";

const upload = multer({storage})

const db = mysql.createConnection({
    // host:'localhost',
    // user:'root',
    // password:'',
    // database:'maiwebusaito',
    host: online_hostname,
    user: online_username,
    password: online_password,
    database: online_database,
    port: online_port,
})

app.post('/upload', upload.single('image'), (req, res) => {
    const image = req.file.filename;
    const query = "UPDATE datalist SET data_imagename = ? WHERE data_name = ?"
    const value = [
        image,
        req.body.name
    ]
    console.log(req.body)
    console.log(req.file)
    db.query(query, value, (err, data) => {
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.get('/',(req, res) => {
    return res.json('Backend bois')
})

app.get('/reference', (req, res) => {
    const query = "SELECT * FROM reference";
    db.query(query, (err,data) => {
        if(err) return res.json(err);
        return res.json(data);
    })
})


// ======== BELOW ARE CRUD =============

// ======== READ ==============
app.get('/view', (req, res) => {
    const query = 
    // `SELECT r.ref_name, d.ref_id, d.data_rowid, d.data_name, d.data_url, d.data_origin, d.data_dateCreated FROM datalist d JOIN reference r on d.ref_id = r.ref_id`
    "SELECT t.ref_id, r.ref_name ,t.data_rowid, d.data_name, d.data_url, d.data_origin, d.data_dateCreated, d.data_imagename, d.data_tag FROM data_table t JOIN reference r ON t.ref_id = r.ref_id JOIN datalist d ON t.data_rowid = d.data_rowid "
    db.query(query, (err,data) => {
        if(err) return res.json(err);
        return res.json(data);
    })
})

// ======== CREATE ==============

app.post('/create', upload.single('image'), (req, res) => {
    const query = "INSERT INTO datalist (`ref_id`, `data_name`, `data_url`, `data_origin`, `data_dateCreated`, `data_tag`) VALUES (?)";
    const value = [
        parseInt(req.body.ref),
        req.body.name,
        req.body.url,
        req.body.origin,
        req.body.datetime,
        req.body.tag,
    ];

    db.query(query, [value], (err, data) => {
        if (err) return res.json(err);

        const newId = data.insertId;

        const newquery = "INSERT INTO data_table (`ref_id`, `data_rowid`) VALUES (?)"
        const value = [
            parseInt(req.body.ref),
            newId
        ]
        db.query(newquery, [value], (err,data) => {
            if (err) return res.json(err)
                return res.json(data)
        })
    });
});

app.post('/createRandomImage', upload.single('random'), (req, res) => {
    const imagename = req.file.filename
    console.log(imagename)
})

// ======== UPDATE ==============

app.post('/modifyData_Table', (req, res) => {
    const query = "DELETE FROM data_table WHERE `data_rowid` = (?)"
    const value = [
        req.body.rowid,
    ]
    db.query(query, [value], (err,data) => {
        if (err) return res.json(err)

        const query2 = "INSERT INTO data_table (`ref_id`, `data_rowid`) VALUES (?)"
        const value2 = [
            req.body.ref,
            req.body.rowid,
        ]
        db.query(query2, [value2], (err,data) => {
            if(err) return res.json(err)
            return res.json(data)
        })
    })
})

app.post('/modifydatalist', (req, res) => {
    const query = "UPDATE `datalist` SET `ref_id` = ?, data_name = ?, data_url = ?, data_origin = ?, data_tag = ? WHERE `datalist`.`data_rowid` = ?"
    const value = [
        req.body.ref,
        req.body.name,
        req.body.url,
        req.body.origin,
        req.body.tag,
        req.body.rowid,
    ]
    db.query(query, value,(err,data) => {
        if (err) return res.json(err)
        return res.json(data)
    })
})

app.post('/EditImageChange', upload.single('image'), (req, res) => {
    const imageChange = req.body.imagechange
    let image;
    let deletepassimage;
    if (imageChange === 'yes'){
        image = req.file.filename;
        deletepassimage = req.body.deleteimage
    }
    const query1 = "UPDATE datalist SET data_name = ?, data_imagename = ? WHERE data_rowid = ?"
    const value1 = [
        req.body.name,
        image,
        req.body.rowid,
    ]
    const query2 = "UPDATE datalist SET data_name = ? WHERE data_rowid = ?"
    const value2 = [
        req.body.name,
        req.body.rowid,
    ]
    console.log('image',image)
    console.log(imageChange)
    console.log(req.file)
    let passedQuery;
    let passedValue
    if (imageChange === 'yes'){
        passedQuery = query1;
        passedValue = value1;
        const imagepath = path.join(__dirname, 'public/images', deletepassimage)
        fs.unlink(imagepath, (err) => {
            if (!err){
                console.log('Success')
            } else {
                console.log(err)
            }
        })
    }
    else {
        passedQuery = query2;
        passedValue = value2;
    }
    db.query(passedQuery, passedValue, (err, data) => {
        if(err) return res.json(err)
        return res.json(data)
    })
})

// ======== DELETE ==============

app.delete('/delete', (req, res) => {
    const query = "DELETE FROM datalist WHERE `data_rowid` = (?)"
    const value = req.body.rowid
    db.query(query,[value], (err, data) => {
        if(err) return res.json(err);
        const data_name = data.data_imagename;
        console.log(data_name)
        
        const query2 = "DELETE FROM data_table WHERE `data_rowid` =(?)"
        const value2 = [req.body.rowid]
        db.query(query2, [value2], (err, data) => {
            if (err) return res.json(err)
            return res.json(data)
        })
    })
})

app.listen(port, () => {
    console.log(`Running in port ${port}`)
})
