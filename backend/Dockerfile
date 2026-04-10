FROM node:20

# Install mtr
RUN apt-get update && apt-get install -y mtr

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]