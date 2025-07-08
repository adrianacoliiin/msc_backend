# services/auth-service/Dockerfile

FROM node:18

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install

# Instalar ts-node y nodemon globalmente para desarrollo
RUN npm install -g nodemon ts-node

# Copiar el resto de la app
COPY . .

# Exponer el puerto
EXPOSE 3001

# Comando por defecto - usar nodemon con TypeScript
CMD ["npm", "run", "dev"]