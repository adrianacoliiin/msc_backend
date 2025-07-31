// src/utils/mailer.ts
import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

interface MailerConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class MailerService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.MAIL_FROM || 'noreply@yourapp.com';
    
    const config: MailerConfig = {
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.MAIL_PORT || '587'),
      secure: process.env.MAIL_SECURE === 'true', // true para 465, false para otros puertos
      auth: {
        user: process.env.MAIL_USER || '',
        pass: process.env.MAIL_PASS || '', // App password para Gmail
      },
    };

    this.transporter = nodemailer.createTransport(config);
  }

  async sendMail({ to, subject, html }: MailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"${process.env.APP_NAME || 'Your App'}" <${this.fromEmail}>`,
        to,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection failed:', error);
      return false;
    }
  }
}

// Instancia singleton
export const mailerService = new MailerService();

// Función helper para facilitar el uso
export const sendMail = async (options: MailOptions): Promise<void> => {
  return mailerService.sendMail(options);
};