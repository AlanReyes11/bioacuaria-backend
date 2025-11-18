#Imagen base
FROM node:22

#Crear carpeta dentro del contenedor
WORKDIR /app

#Copiar package.json y package-lock.json primero (para aprovechar cache)
COPY package*.json ./

#Instalar dependencias
RUN npm install

#Copiar todo el backend
COPY . .

#Exponer el puerto
EXPOSE 3000

#Comando para iniciar el backend
CMD ["npm", "start"]
