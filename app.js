const express = require('express');
const mysql = require('mysql');
const util = require('util');
const ejs = require('ejs');


const app = express();
const PORT = 3000;

// Leer archivos estaticos de la carpeta public
app.use(express.static('public'));
// Leer info del form
app.use(express.urlencoded({extended:true}));

// Cargar vista con ejs
app.set('view engine', 'ejs');


app.use(express.json()); // Permite el mapeo de la peticion de JSON a JS

//Conexion a base de datos
const conexion = mysql.createConnection({
    host: 'us-cdbr-east-03.cleardb.com',
    user: 'ba1762bbe88050',
    password: '3213ee28',
    database: 'heroku_3ca8164a51f4a1f'
});

// Verificar conexion a base de datos
conexion.connect( (error) => {
    if (error){
        throw error;
    }

    console.log("Conexion establecida con base de datos");
});

const qy = util.promisify(conexion.query).bind(conexion); // Permite el uso de async await en la conexion a la base de datos

// Rutas

//Participantes

// Cargar formulario al entrar a la pagina
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,'.public/index.html'));
})

// Mostrar resultados de la rifa
app.get('/rifa', async (req, res) => {
    try {
        const query = 'SELECT * FROM participante';

        const respuesta = await qy(query);

        for (let i = 0; i < respuesta.length; i++){
            if (respuesta[i].id_pais == 1){
                respuesta[i].id_pais = "Argentina"; 
            }
            if (respuesta[i].id_pais == 2){
                respuesta[i].id_pais = "Uruguay"; 
            }
            if (respuesta[i].id_pais == 3){
                respuesta[i].id_pais = "Brasil"; 
            }
        }
        res.render('pages/resultados', {
            respuesta
        })

    } catch (error) {
        console.error(error.message);
        res.status(413).send({'Error': error.message});
    }
})

// Enviar informacion de participante en formulario
app.post('/rifa', async (req, res) => {
    try {

        console.log("Datos recibidos en formulario: " + req.body.nombre, req.body.apellido, req.body.numero, req.body.pais)
        if (!req.body.nombre || !req.body.apellido || !req.body.numero || !req.body.pais){
            throw new Error ("Faltan datos por enviar");
        }

    // Valido que no se repita participante
    let query = 'SELECT * FROM participante WHERE nombre = ? AND apellido = ?'
    let respuesta = await qy(query, [req.body.nombre, req.body.apellido]);

    if (respuesta.length > 0){
        throw new Error('Ya elegiste tu numero de rifa');
    }

    // Valido que no se repita numero
    query = 'SELECT * FROM participante WHERE numero = ?'
    respuesta = await qy(query, [req.body.numero]);

    if (respuesta.length > 0){
        throw new Error('Ya este numero esta tomado, por favor elegir otro');
    }

    // Guardo el participante y su eleccion
    query = 'INSERT INTO participante (nombre, apellido, numero, id_pais) VALUE (?, ?, ?, ?)';
    respuesta = await qy(query, [req.body.nombre, req.body.apellido, req.body.numero, req.body.pais]);

    query = 'SELECT * FROM participante'
    respuesta = await qy(query)
    console.log(respuesta);

    if(respuesta.length < 5){
        res.redirect('/');
    }
    else
    {
        res.redirect('/rifa');
    }
   

    } catch (error) {
        console.error(error.message);
        res.status(413).send({'Error': error.message});
    }
})

// Borro los datos de la tabla
app.post('/delete', async (req, res) => {
    try {

        let query = 'DELETE FROM participante'
        let respuesta = await qy(query)

        
        console.log(respuesta);
        res.redirect('/');

    } catch (error) {
        console.error(error.message);
        res.status(413).send({'Error': error.message});
    }
})

// Redirecciona en caso de ir a rutas diferentes
app.get("*", (req,res) => {
    res.redirect("/");
}) 


app.listen(process.env.PORT || PORT, () => {
    console.log('Servidor escuchando en puerto ', PORT);
})