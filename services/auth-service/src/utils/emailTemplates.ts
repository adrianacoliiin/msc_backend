// src/utils/emailTemplates.ts

interface EmailTemplate {
    subject: string;
    html: string;
  }
  
  const getBaseTemplate = (content: string): string => {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 20px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #3498db;
            text-decoration: none;
          }
          h1 {
            color: #2c3e50;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background-color: #3498db;
            color: white !important;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-weight: bold;
            text-align: center;
          }
          .button:hover {
            background-color: #2980b9;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
          }
          .warning {
            background-color: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #ffc107;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${process.env.APP_NAME || 'Interlinked'}</div>
          </div>
          ${content}
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Interlinked'}. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  
  export const getWelcomeEmail = (name: string, role: string = 'user'): EmailTemplate => {
    const isAdmin = role === 'admin';
    
    const content = `
      <h1>¡Bienvenido${name ? `, ${name}` : ''}!</h1>
      
      ${isAdmin ? 
        `<p>Tu cuenta de <strong>administrador</strong> ha sido creada exitosamente y ya está activa.</p>
         <p>Puedes iniciar sesión inmediatamente y comenzar a gestionar la plataforma.</p>` :
        `<p>Tu cuenta ha sido creada exitosamente.</p>
         <p>Tu registro está <strong>pendiente de aprobación</strong> por parte de un administrador. Te notificaremos por correo electrónico una vez que tu cuenta sea aprobada.</p>`
      }
      
      <div style="background-color: #e8f4fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #2c3e50;">¿Qué sigue?</h3>
        <ul style="margin-bottom: 0;">
          ${isAdmin ? 
            `<li>Accede al panel de administración</li>
             <li>Gestiona usuarios pendientes</li>
             <li>Configura los ajustes de la plataforma</li>` :
            `<li>Espera la aprobación de tu cuenta</li>
             <li>Recibirás un correo de confirmación cuando sea aprobada</li>
             <li>Podrás iniciar sesión una vez aprobada</li>`
          }
        </ul>
      </div>
      
      <p>Si tienes alguna pregunta, no dudes en contactar a nuestro equipo de soporte.</p>
      
      <p>¡Gracias por unirte a nosotros!</p>
    `;
  
    return {
      subject: `¡Bienvenido a ${process.env.APP_NAME || 'nuestra plataforma'}!`,
      html: getBaseTemplate(content)
    };
  };
  
  export const getResetPasswordEmail = (name: string, resetToken: string): EmailTemplate => {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    const expirationTime = process.env.RESET_TOKEN_EXPIRES || '1 hora';
    
    const content = `
      <h1>Recuperación de Contraseña</h1>
      
      <p>Hola${name ? ` ${name}` : ''},</p>
      
      <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
      
      <p>Si fuiste tú quien solicitó este cambio, haz clic en el siguiente botón para crear una nueva contraseña:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" class="button">Restablecer Contraseña</a>
      </div>
      
      <div class="warning">
        <strong>⚠️ Importante:</strong>
        <ul style="margin: 10px 0 0 0;">
          <li>Este enlace expirará en <strong>${expirationTime}</strong></li>
          <li>Solo puedes usar este enlace una vez</li>
          <li>Si no solicitaste este cambio, puedes ignorar este correo</li>
        </ul>
      </div>
      
      <p>Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
      <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
        ${resetLink}
      </p>
      
      <p>Si no solicitaste este cambio de contraseña, tu cuenta sigue siendo segura y puedes ignorar este correo.</p>
    `;
  
    return {
      subject: 'Recuperación de contraseña - Acción requerida',
      html: getBaseTemplate(content)
    };
  };
  
  export const getStatusUpdateEmail = (name: string, status: 'active' | 'rejected'): EmailTemplate => {
    const isApproved = status === 'active';
    
    const content = `
      <h1>${isApproved ? '¡Cuenta Aprobada!' : 'Actualización de tu cuenta'}</h1>
      
      <p>Hola${name ? ` ${name}` : ''},</p>
      
      ${isApproved ? 
        `<p>¡Excelentes noticias! Tu cuenta ha sido <strong>aprobada</strong> por nuestro equipo de administradores.</p>
         
         <p>Ya puedes iniciar sesión y comenzar a usar la plataforma.</p>
         
         <div style="text-align: center; margin: 30px 0;">
           <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Iniciar Sesión</a>
         </div>
         
         <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
           <strong>¡Bienvenido a la plataforma!</strong><br>
           Ahora tienes acceso completo a todas las funcionalidades disponibles para tu rol.
         </div>` :
        
        `<p>Lamentamos informarte que tu solicitud de cuenta ha sido <strong>rechazada</strong>.</p>
         
         <div class="warning">
           <strong>Motivo del rechazo:</strong><br>
           Tu solicitud no cumple con los criterios de aprobación actuales. 
           Si crees que esto es un error o necesitas más información, por favor contacta a nuestro equipo de soporte.
         </div>
         
         <p>Si tienes preguntas sobre esta decisión o deseas apelar, puedes contactarnos respondiendo a este correo.</p>`
      }
      
      <p>Gracias por tu interés en nuestra plataforma.</p>
    `;
  
    return {
      subject: isApproved ? 
        `¡Tu cuenta ha sido aprobada! - ${process.env.APP_NAME || 'App'}` : 
        `Actualización de tu solicitud de cuenta - ${process.env.APP_NAME || 'App'}`,
      html: getBaseTemplate(content)
    };
  };