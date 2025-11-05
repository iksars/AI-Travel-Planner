# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Accept DATABASE_URL as a build argument
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Copy package.json and package-lock.json (if available)
COPY package.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Copy prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Make port 3000 available to the world outside this container
EXPOSE 3000

RUN npm run build

# Define the command to run the app
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["npm", "start"]
