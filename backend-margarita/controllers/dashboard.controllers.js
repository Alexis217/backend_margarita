import { ConnectionDataBase } from "../src/database.js";

export const getCausaStatus = async (req, res) => {
  const connection = await ConnectionDataBase();
  try {
    // Consulta para contar causas activas
    const [causasActivas] = await connection.query(
      "SELECT COUNT(*) AS count FROM causas WHERE causa_finalizada = 0"
    );
    // Consulta para contar causas finalizadas
    const [causasFinalizadas] = await connection.query(
      "SELECT COUNT(*) AS count FROM causas WHERE causa_finalizada = 1"
    );

    res.status(200).json({
      active: causasActivas[0].count,
      finished: causasFinalizadas[0].count,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al obtener el estado de las causas" });
  }
};

export const getMonthlyRevenue = async (req, res) => {
  const connection = await ConnectionDataBase();
  try {
    // Consulta para obtener el monto recaudado por cada mes
    const [monthlyRevenue] = await connection.query(`
      SELECT 
        DATE_FORMAT(fecha_creacion, '%Y-%m') AS month,
        SUM(monto_recaudado) AS total_recaudado
      FROM causas
      GROUP BY month
      ORDER BY month ASC
    `);

    // Formatear los datos en un objeto de respuesta
    const data = monthlyRevenue.map((row) => ({
      month: row.month,
      total_recaudado: row.total_recaudado,
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al obtener el monto recaudado mensual" });
  }
};
