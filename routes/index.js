var express = require('express');
var router = express.Router();
var nodemailer = require("nodemailer");
var novedadesModel = require('../models/novedadesModel');
var cloudinary = require('cloudinary').v2;

/* GET home page. */
router.get('/', async function(req, res, next) {
    cliente = await novedadesModel.getClientes();
    cliente = cliente.splice(0,5);
    cliente = cliente.map(cliente => {
    if(cliente.img_id){
      const imagen = cloudinary.url(cliente.img_id, {
        width: 460,
        crop: 'fill'
      });
      return {
        ...cliente,
        imagen
      }
    } else{
        return {
          ...cliente,
          imagen: '/images/noimagen.jpg'
        }
      }
  });
    res.render('index', {
        cliente
    });
});
router.post('/', async (req, res, next) => {
    console.log(req.body)
    var nombre = req.body.nombre;
    var apellido = req.body.apellido;
    var tel = req.body.tel;
    var mensaje = req.body.mensaje;
    var obj = {
        to: 'severioguido2411@gmail.com',
        subject: 'CONTACTO WEB',
        html: nombre + " "+ apellido + " " + " se contacto a través de la web y quiere mas informacion a este teléfono: " + tel + ". Además, añadió este comentario: " + mensaje
    }
    var transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    var info = await transport.sendMail(obj);
    res.render('index', {
        message: 'Mensaje enviado correctamente',
    });
});
module.exports = router;