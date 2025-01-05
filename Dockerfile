# Usa una imagen base de Node.js
FROM node:18-slim

# Directorio de trabajo en el contenedor
WORKDIR /app

# Archivos al directorio de trabajo
COPY . .

# Instala las dependencias del proyecto
RUN npm install
RUN npm audit --production || echo "Existen vulnerabilidades, revísalas antes del despliegue"

# Expone el puerto 8080
EXPOSE 8080

# Comando de inicio de la aplicación
CMD ["npm", "start"]

