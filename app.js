// Code adapted and modified from https://github.com/osu-cs340-ecampus/nodejs-starter-app/tree/main

// App.js

/*
    SETUP
*/
var express = require('express');   // We are using the express library for the web server
var app     = express();            // We need to instantiate an express object to interact with the server in our code
PORT        = 6060;                 // Set a port number at the top so it's easy to change in the future

// app.js
const { engine } = require('express-handlebars');
app.engine('.hbs', engine({extname: ".hbs"}));  // Create an instance of the handlebars engine to process templates
app.set('view engine', '.hbs');                 // Tell express to use the handlebars engine whenever it encounters a *.hbs file.

// Database
var db = require('./database/db-connector')

// app.js - SETUP section
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static('/public')); 
    

// app.js


app.get('/', function(req, res)
{
    // Declare Query 1
    let query1;

    // If there is no query string, we just perform a basic SELECT
    if (req.query.mediaID === undefined)
    {
        query1 = "SELECT * FROM Copies;";
    }

    // If there is a query string, we assume this is a search, and return desired results
    else
    {
        query1 = `SELECT * FROM Copies WHERE mediaID LIKE "${req.query.mediaID}%"`
    }

    // Query 2 is the same in both cases
    let query2 = "SELECT * FROM Customers;";

    // Run the 1st query
    db.pool.query(query1, function(error, rows, fields){
        
        // Save the copies
        let copies = rows;
        
        // Run the second query
        db.pool.query(query2, (error, rows, fields) => {
            
            // Save the customers
            let customers = rows;

            // BEGINNING OF NEW CODE

            // Construct an object for reference in the table
            // Array.map is awesome for doing something with each
            // element of an array.
            let customermap = {}
            customers.map(customer => {
                let id = parseInt(customer.customerID, 10);

                customermap[id] = `${customer.firstName} ${customer.lastName}`;
            })

            // Overwrite the homeworld ID with the name of the customer in the media object
            copies = copies.map(copy => {
                return Object.assign(copy, { customerName: customermap[copy.customerID]})
            })

            // END OF NEW CODE
            return res.render('index', {data: copies, customers: customers});
        })
    })
});

/*
app.post('/add-copy-form', function(req, res){
    // Capture the incoming data and parse it back to a JS object
    let data = req.body;

    // Capture NULL values
    let homeworld = parseInt(data['input-homeworld']);
    if (isNaN(homeworld))
    {
        homeworld = 'NULL'
    }

    let age = parseInt(data['input-age']);
    if (isNaN(age))
    {
        age = 'NULL'
    }

    // Create the query and run it on the database
    query1 = `INSERT INTO bsg_people (fname, lname, homeworld, age) VALUES ('${data['input-fname']}', '${data['input-lname']}', ${homeworld}, ${age})`;
    db.pool.query(query1, function(error, rows, fields){

        // Check to see if there was an error
        if (error) {

            // Log the error to the terminal so we know what went wrong, and send the visitor an HTTP response 400 indicating it was a bad request.
            console.log(error)
            res.sendStatus(400);
        }

        // If there was no error, we redirect back to our root route, which automatically runs the SELECT * FROM bsg_people and
        // presents it on the screen
        else
        {
            res.redirect('/');
        }
    })
});
*/

app.post('/add-copy-ajax', function(req, res) 
{
    // Capture the incoming data and parse it back to a JS object
    let data = req.body;

    // Capture NULL values
    let mediaID = parseInt(data.mediaID);
    if (isNaN(mediaID))
    {
        mediaID = 'NULL'
    }

    let customerID = parseInt(data.customerID);
    if (isNaN(customerID))
    {
        customerID = 'NULL'
    }

    // Create the query and run it on the database
    query1 = `INSERT INTO Copies (mediaID, customerID) VALUES (${mediaID}, ${customerID})`;
    db.pool.query(query1, function(error, rows, fields){

        // Check to see if there was an error
        if (error) {

            // Log the error to the terminal so we know what went wrong, and send the visitor an HTTP response 400 indicating it was a bad request.
            console.log(error)
            res.sendStatus(400);
        }
        else
        {
            // If there was no error, perform a SELECT * on bsg_people
            query2 = `SELECT * FROM Copies;`;
            db.pool.query(query2, function(error, rows, fields){

                // If there was an error on the second query, send a 400
                if (error) {
                    
                    // Log the error to the terminal so we know what went wrong, and send the visitor an HTTP response 400 indicating it was a bad request.
                    console.log(error);
                    res.sendStatus(400);
                }
                // If all went well, send the results of the query back.
                else
                {
                    res.send(rows);
                }
            })
        }
    })
});

app.delete('/delete-copy-ajax/', function(req,res,next){
  let data = req.body;
  let copyID = parseInt(data.id);
  let deleteCopy = `DELETE FROM Copies WHERE copyID = ?`;


        // Run the 1st query
        db.pool.query(deleteCopy, [copyID], function(error, rows, fields){
            if (error) {

            // Log the error to the terminal so we know what went wrong, and send the visitor an HTTP response 400 indicating it was a bad request.
            console.log(error);
            res.sendStatus(400);
            }

            else
            {
                // Run the second query
                db.pool.query(deleteCopy, [copyID], function(error, rows, fields) {

                    if (error) {
                        console.log(error);
                        res.sendStatus(400);
                    } else {
                        res.sendStatus(204);
                    }
                })
            }
})});

app.put('/put-copy-ajax', function(req,res,next){                                   
  let data = req.body;

  let mediaID = parseInt(data.mediaID);
  let customerID = parseInt(data.customerID);

  queryUpdateCopy = `UPDATE Copies SET customerID = ? WHERE mediaID = ?`;
  selectCopy = `SELECT * FROM Copies WHERE mediaID = ?`

        // Run the 1st query
        db.pool.query(queryUpdateCopy, [customerID, mediaID], function(error, rows, fields){
            if (error) {

            // Log the error to the terminal so we know what went wrong, and send the visitor an HTTP response 400 indicating it was a bad request.
            console.log(error);
            res.sendStatus(400);
            }

            // If there was no error, we run our second query and return that data so we can use it to update the people's
            // table on the front-end
            else
            {
                // Run the second query
                db.pool.query(selectCopy, [mediaID], function(error, rows, fields) {
        
                    if (error) {
                        console.log(error);
                        res.sendStatus(400);
                    } else {
                        res.send(rows);
                    }
                })
            }
})});



/*
    LISTENER
*/
app.listen(PORT, function(){            // This is the basic syntax for what is called the 'listener' which receives incoming requests on the specified PORT.
    console.log('Express started on http://localhost:' + PORT + '; press Ctrl-C to terminate.')
});