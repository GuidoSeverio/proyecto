var express = require('express');
var router = express.Router();
var novedadesModel = require('./../../models/novedadesModel');
var util = require('util');
var cloudinary = require('cloudinary').v2;

const uploader = util.promisify(cloudinary.uploader.upload);
const destroy = util.promisify(cloudinary.uploader.destroy);

router.get('/', async function(req, res, next) {
  //var novedades = await novedadesModel.getClientes();

  var novedades
  if (req.query.q === undefined) {
    novedades = await novedadesModel.getClientes();
  } else {
    novedades = await novedadesModel.buscarNovedades(req.query.q);
  }

  novedades = novedades.map(novedad => {
    if(novedad.img_id){
      const imagen = cloudinary.image(novedad.img_id, {
        width: 100,
        height: 100,
        crop: 'fill'
      });
      return {
        ...novedad,
        imagen
      }
    } else{
        return {
          ...novedad,
          imagen: ''
        }
      }
  });

  res.render('admin/novedades', {
    layout: 'admin/layout',
    usuario: req.session.nombre,
    novedades,
    is_search: req.query.q !== undefined,
    q: req.query.q
  });
});

router.get('/eliminar/:id', async (req, res, next)=> {
  var id = req.params.id;

  let cliente = await novedadesModel.getClienteById(id);
  if(cliente.img_id) {
    await (destroy(cliente.img_id));
  }

  await novedadesModel.deleteClienteById(id);
  res.redirect('/admin/novedades')
});

router.get('/agregar', (req, res, next) => {
  res.render('admin/agregar',{
    layout: 'admin/layout'
  });
});

router.post('/agregar', async (req, res, next) =>{
  try{
    var img_id = '';
    if(req.files && Object.keys(req.files).length > 0){
      imagen = req.files.imagen;
      img_id = (await uploader(imagen.tempFilePath)).public_id;
    }

    if(req.body.nombre != "" && req.body.comentario != ""){
      await novedadesModel.insertCliente({
        ...req.body,
        img_id
      });

      res.redirect('/admin/novedades')
    } else {
      res.render('admin/agregar', {
        layout: 'admin/layout',
        error: true, message: 'Todos los campos deben ser completados'
      })
    }
  } catch (error){
    console.log(error)
    res.render('admin/agregar', {
      layout: 'admin/layout',
      error: true, message: 'No se cargó el cliente'
    });
  }
});

router.get('/modificar/:id', async (req, res, next) =>{
  let id = req.params.id;
  let cliente = await novedadesModel.getClienteById(id);
  res.render('admin/modificar', {
    layout: 'admin/layout',
    cliente
  });
});

router.post('/modificar', async (req, res, next) => {
  try{
    let img_id = req.body.img_original;
    let borrar_img_vieja = false;
    if (req.body.img_delete === "1") {
      img_id = null;
      borrar_img_vieja = true;
    } else {
      if (req.files && Object.keys(req.files).length > 0) {
        imagen = req.files.imagen;
        img_id = (await uploader(imagen.tempFilePath)).public_id;
        borrar_img_vieja = true;
      }
    }
    if (borrar_img_vieja && req.body.img_original) {
      await (destroy(req.body.img_original));
    }

    let obj = {
      nombre: req.body.nombre,
      comentario: req.body.comentario,
      img_id
    }
    await novedadesModel.modificarClienteById(obj, req.body.id);
    res.redirect('/admin/novedades');
  } catch (error) {
    console.log(error)
    res.render('admin/modificar', {
      layout: 'admin/layout',
      error: true, message: 'No se modificó al cliente y/o comentario'
    });
  }
});

module.exports = router;
