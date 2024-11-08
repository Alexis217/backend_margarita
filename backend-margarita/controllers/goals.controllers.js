import { ConnectionDataBase } from "../src/database.js";
import { createAddress } from "./transfer.controller.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Configura Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const getInfoQuoteCtrl = async (req, res) => {
  try {
    //Conexión Base de Datos
    const connection = await ConnectionDataBase();
    //Selecciona todas las frases
    const [quotes] = await connection.query("SELECT * FROM frases_causas");

    connection.end();

    //Selecciona una frase random
    let randomQuoteIndex = Math.floor(Math.random() * quotes.length);

    const RandomQuote = {
      id: quotes[randomQuoteIndex].id_frase,
      autor: quotes[randomQuoteIndex].autor_frase,
      frase: quotes[randomQuoteIndex].frase,
    };

    //La envia al frontend
    res.json([RandomQuote]);
  } catch (error) {
    console.log("Error al recibir las frases", error);
    res.status(500).json({ message: "Error al obtener las frases" });
  }
};

export const PendingGoalsCtrl = async (req, res) => {
  //Agarra la información de la causa
  try {
    const {
      titleGoal,
      descriptionGoal,
      numberContactGoal,
      emailContactGoal,
      typeGoal,
      amountGoal,
    } = req.body;

    console.log(req.body);

    const connection = await ConnectionDataBase();

    //Verifica la autorización del usuario
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "No autorizado" });
    }

    //Define el tipo de causa
    const [idGoal] = await connection.query(
      "SELECT id_tipo_causa FROM tipos_causa WHERE tipo_causa = ?",
      [typeGoal]
    );

    if (idGoal.length === 0) {
      return res.status(404).json({ message: "Tipo de causa no encontrado" });
    }

    const idTypeGoal = idGoal[0].id_tipo_causa;

    // Si la meta no es "Dinero", amountGoal debe ser 0
    const finalAmountGoal = typeGoal === "Dinero" ? amountGoal : 0;

    //Sube la causa como causa pendientes
    const [pendingGoal] = await connection.query(
      "INSERT INTO causas (id_tipo_causa, id_usuario, titulo_causa, descripcion, monto_recaudar, contact_tel_causa, contact_corr_causa, monto_recaudado, causa_finalizada, causa_aceptada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        idTypeGoal,
        user.id,
        titleGoal,
        descriptionGoal,
        finalAmountGoal,
        numberContactGoal,
        emailContactGoal,
        0,
        0,
        0,
      ]
    );

    //Agarra el id de la causa pendiente para ponerlo en los params
    const idPendingGoal = pendingGoal.insertId;

    connection.end();

    const mailOptions = {
      from: emailContactGoal, // Email del remitente
      to: "fundacionmargarita24@gmail.com", // Tu correo donde recibirás la peticion de causa
      subject: `Propuesta para subir causa de ${user.username}`,
      html: `
                    <div style="font-family: Arial, sans-serif; padding: 16px; background-color: #fefce8; border-radius: 8px; border: 1px solid #FFFF00; max-width: 600px; margin: 0 auto; text-align: center;">
                        <img src="https://i.pinimg.com/originals/11/94/c7/1194c7e6b8da26afee2a502f0e004e8f.png" alt="Margarita" style="width: 100px; height: auto; margin-bottom: 20px;" />
                        <h2 style="font-size: 24px; color: #fcd34d; margin-bottom: 20px;">Información sobre la causa:</h2>
                        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <p style="font-size: 18px; color: #000000;"><strong>Titulo de Causa:</strong> ${titleGoal}</p>
                            <p style="font-size: 18px; color: #000000;"><strong>Descripción de Causa:</strong> ${descriptionGoal}</p>
                            <p style="font-size: 18px; color: #000000;"><strong>Email de contacto:</strong> ${emailContactGoal}</p>
                            <p style="font-size: 18px; color: #000000;"><strong>Numero de contacto:</strong>${numberContactGoal}</p>
                            <p style="font-size: 18px; color: #000000;"><strong>Tipo de Causa:</strong>${typeGoal}</p>
                            <p style="font-size: 18px; color: #000000;"><strong>Monto a Recaudar:</strong>${amountGoal}</p>
    
                        </div>
                        <footer style="font-size: 14px; color: #fcd34d; margin-top: 20px;">
                            <p>Peticion de causa enviada por ${user.email}</p>
                        </footer>
                    <div style="margin-top: 20px;">
                    <form action="http://localhost:3000/accept-goal/${idPendingGoal}" method="POST">
                    <button type="submit" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; margin: 10px;">Aceptar Causa</button>
                        </form>
                    <form action="http://localhost:3000/reject-goal/${idPendingGoal}" method="POST">
                    <button type="submit" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 5px;">Rechazar Causa</button>
                    </form>
                    </div>
                    </div>
                `,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(200)
      .json({ message: "Causa pendiente evaluándose", idPendingGoal });
  } catch (error) {
    console.log("Error al subir las causas", error);
    res.status(500).json({ message: "Error al subir las causas" });
  }
};

export const acceptGoalCtrl = async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await ConnectionDataBase();

    // Buscar la causa que coincida con el id y esté pendiente de aceptación
    const [goal] = await connection.query(
      "SELECT * FROM causas WHERE id_causa = ? AND causa_aceptada = 0",
      id
    );

    if (goal.length === 0) {
      return res.status(404).json({ message: "Causa pendiente no encontrada" });
    }

    const userId = goal[0].id_usuario;

    // Crear una nueva dirección
    const newAddress = await createAddress(userId);

    // Actualizar la causa con la nueva dirección y marcarla como aceptada
    await connection.query(
      "UPDATE causas SET causa_aceptada = 1, direccion_margaritas = ? WHERE id_causa = ?",
      [newAddress, id]
    );

    connection.end();

    res.json({
      message: "Causa Aceptada y Dirección Generada",
      address: newAddress,
    });
  } catch (error) {
    console.error("Error al aceptar la causa y crear la dirección", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const rejectGoalCtrl = async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await ConnectionDataBase();

    //Si la causa es rechazada se elimina de causas pendientes
    const [goal] = await connection.query(
      "DELETE FROM `causas` WHERE id_causa = ? AND causa_aceptada = 0",
      id
    );

    if (goal.length === 0) {
      return res.status(404).json({ message: "Causa pendiente no encontrada" });
    }
    return res.json({ message: "Causa Rechazada" });
  } catch (error) {
    console.error("Error al eliminar la causa", error);
  }
};

export const renderGoalsCtrl = async (req, res) => {
  try {
    const connection = await ConnectionDataBase();

    const [infoGoal] = await connection.query(
      "SELECT * FROM causas WHERE causa_aceptada = 1"
    );

    if (infoGoal.length === 0) {
      return res.status(404).json({ message: "No se encontraron causas" });
    }

    connection.end();

    const goals = infoGoal.map((goal) => ({
      id: goal.id_causa,
      title: goal.titulo_causa,
      description: goal.descripcion,
      finalGoal: goal.monto_recaudar,
      contactTel: goal.contact_tel_causa,
      contactEmail: goal.contact_corr_causa,
      goalCollected: goal.monto_recaudado,
      address: goal.direccion_margaritas, // Agregar la dirección aquí
    }));

    res.json(goals);
  } catch (error) {
    console.error("Error al recibir la información de las causas", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const getCauseinfo = async (req, res) => {
  const { id } = req.params;
  const connection = await ConnectionDataBase();

  try {
    // Consulta para obtener la causa activa asociada al usuario
    const [activeCause] = await connection.query(
      "SELECT * FROM causas WHERE id_usuario = ? AND causa_finalizada = 0 LIMIT 1",
      [id]
    );

    // Consulta para obtener las causas finalizadas del usuario
    const [finishedCauses] = await connection.query(
      "SELECT * FROM causas WHERE id_usuario = ? AND causa_finalizada = 1",
      [id]
    );

    res.status(200).json({
      activeCause: activeCause.length > 0 ? activeCause[0] : null,
      finishedCauses,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al obtener la información de las causas" });
  }
};
