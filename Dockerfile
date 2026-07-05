# Step 1: Build the React Application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package descriptors
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Declare Build Arguments for Vite Environment Variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Convert build args to environment variables so Vite can pick them up
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build the project
RUN npm run build

# Step 2: Serve the application using Nginx
FROM nginx:alpine

# Copy built files from the build stage to Nginx web root
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration for React Router routing support
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
