FROM node:20-alpine

# Install OpenSSL for Prisma compatibility and curl for health checks
RUN apk add --no-cache openssl openssl-dev curl

WORKDIR /app

COPY package.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 3001

CMD ["npx", "tsx", "src/index.ts"]
