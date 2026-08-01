import { pool } from '../config/database.js';
import { sendNotificationMail } from '../services/mailService.js';

export async function contact(req, res, next) {
  try {
    const { name, email, subject, message } = req.body;

    await pool.execute(
      `INSERT INTO contact_messages (type, name, email, subject, message, status)
       VALUES ('contact', :name, :email, :subject, :message, 'new')`,
      {
        name,
        email,
        subject,
        message
      }
    );

    await sendNotificationMail({
      subject: `Spilweb contact: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      replyTo: email,
      replyToName: name
    });

    return res.status(201).json({
      message: 'Your message has been received. We will contact you soon.'
    });
  } catch (error) {
    return next(error);
  }
}

export async function quote(req, res, next) {
  try {
    const { name, company, email, service, message } = req.body;

    await pool.execute(
      `INSERT INTO contact_messages (type, name, company, email, subject, service, message, status)
       VALUES ('quote', :name, :company, :email, 'Quote request', :service, :message, 'new')`,
      {
        name,
        company: company || null,
        email,
        service,
        message
      }
    );

    await sendNotificationMail({
      subject: `Spilweb quote request: ${service}`,
      text: `Name: ${name}\nCompany: ${company || '-'}\nEmail: ${email}\nService: ${service}\n\n${message}`,
      replyTo: email,
      replyToName: name
    });

    return res.status(201).json({
      message: 'Your quote request has been received. We will contact you soon.'
    });
  } catch (error) {
    return next(error);
  }
}
