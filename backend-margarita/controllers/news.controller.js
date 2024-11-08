import { ConnectionDataBase } from "../src/database.js";

export const uploadNewsCtrl = async (req, res) => {
  try {
    // Obtener los datos de la noticia del cuerpo de la solicitud
    const { title, content, imageUrl } = req.body;

    // Conexión a la base de datos
    const connection = await ConnectionDataBase();

    // Verificar autorización del usuario
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "No autorizado" });
    }

    // Insertar la noticia en la base de datos
    await connection.query(
      "INSERT INTO noticias (id_usuario, titulo, contenido, imagen_url, estado_noticia) VALUES (?, ?, ?, ?, ?)",
      [user.id, title, content, imageUrl, 0] // `estado_noticia` en 0 para indicar que no está publicado
    );

    // Cerrar la conexión
    connection.end();

    res.status(200).json({ message: "Noticia subida correctamente" });
  } catch (error) {
    console.error("Error al subir la noticia:", error);
    res.status(500).json({ message: "Error al subir la noticia" });
  }
};

export const getNewsCtrl = async (req, res) => {
  try {
    // Conexión a la base de datos
    const connection = await ConnectionDataBase();

    // Obtener noticias desde la base de datos
    const [news] = await connection.query(
      "SELECT * FROM noticias WHERE estado_noticia = 1"
    );

    // Cerrar la conexión
    connection.end();

    // Enviar respuesta con las noticias
    res.status(200).json(news);
  } catch (error) {
    console.error("Error al obtener las noticias:", error);
    res.status(500).json({ message: "Error al obtener las noticias" });
  }
};
