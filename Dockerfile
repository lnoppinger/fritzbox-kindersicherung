FROM node:22

WORKDIR /app

RUN npm install express morgan axios xml2js dotenv cheerio

COPY . ./

EXPOSE 80

CMD ["node", "index.mjs"]