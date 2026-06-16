FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Exposing host IP to allow outside access when run in docker container
ENV HOST=0.0.0.0

CMD ["npm", "run", "dev", "--", "--host"]
