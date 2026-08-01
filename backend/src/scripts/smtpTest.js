import { createTransporter } from '../services/mailService.js';

try {
  const transporter = createTransporter();
  await transporter.verify();
  console.log('SMTP connection verified successfully.');
  process.exit(0);
} catch (error) {
  console.error('SMTP connection failed.');
  console.error(error);
  process.exit(1);
}
