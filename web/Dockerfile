FROM node:18-alpine
WORKDIR /app
COPY web/package.json ./package.json
COPY web/vite.config.js ./vite.config.js
COPY web/tailwind.config.js ./tailwind.config.js
COPY web/postcss.config.js ./postcss.config.js
COPY web/index.html ./index.html
COPY web/src ./src
RUN npm install
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
