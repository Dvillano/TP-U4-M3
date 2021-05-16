const express = require('express');
const mysql = require('mysql');
const util = require('util');

const app = express();
const PORT = 3000;

app.use(express.json()); // Permite el mapeo de la peticion de JSON a JS

//Conexion a base de datos
const conexion = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'gestionempleados'
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

// EMPLEADOS
/** 
 * Metodo POST para enviar informacion
 * Metodo GET para mostrarla
 */
// Obtener toda la informacion de la tabla empleados
app.get('/empleados', async (req, res) => {
    try {
        const query = 'SELECT * FROM empleados';

        const respuesta = await qy(query);

        res.send({'respuesta': respuesta});
        console.log(respuesta);
    } catch (error) {
        console.error(error.message);
        res.status(413).send({'Error': error.message});
    }
})

// Agregar informacion de empleado
app.post('/empleados', async (req, res) => {
    try {
        // Validacion
        if(!req.body.nombre || !req.body.apellido || !req.body.sexo){
            throw new Error('Falta enviar algun dato');
        }

        //Verifico que no exista previamente esa persona
        let query = 'SELECT * FROM empleados WHERE nombre = ? AND apellido = ? AND sexo = ?'

        let respuesta = await qy(query, [req.body.nombre, req.body.apellido, req.body.sexo]);

        if (respuesta.length > 0){
            throw new Error('Ese empleado ya existe');
        }

        // Guardar empleado
        query = 'INSERT INTO empleados (nombre, apellido, sexo, oficina) VALUES (?, ?, ?, ?)';
        respuesta = await qy(query, [req.body.nombre, req.body.apellido, req.body.sexo, req.body.oficina]);

        // Guardar oficina
        query = 'INSERT INTO oficinas (localidad) VALUES (?)';
        respuesta = await qy(query, [req.body.oficina]);

        console.log(respuesta);
        res.send({'respuesta': respuesta.affectedRows});

    } catch (error) {
        console.error(error.message);
        res.status(413).send({'Error': error.message});
    }
})


app.listen(PORT, () => {
    console.log('Servidor escuchando en puerto ', PORT);
})