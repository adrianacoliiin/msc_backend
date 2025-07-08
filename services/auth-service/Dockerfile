# services/auth-service/Dockerfile

FROM node:18

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto de la app
COPY . .

# Exponer el puerto (ajústalo si usas otro)
EXPOSE 3001

# Comando por defecto
CMD ["npm", "run", "dev"]
