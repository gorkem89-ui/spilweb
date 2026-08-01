import { pool } from '../config/database.js';

export async function languages(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT code, name, native_name AS nativeName, is_default AS isDefault FROM languages WHERE is_active = 1 ORDER BY sort_order ASC'
    );
    return res.json({ data: rows });
  } catch (error) {
    return next(error);
  }
}

export async function settings(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT `key`, `value`, type FROM settings');
    const data = rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    return res.json({ data });
  } catch (error) {
    return next(error);
  }
}
