FROM node:10-alpine

WORKDIR /usr/app

COPY package*.json yarn.lock ./

RUN yarn

COPY . .

############################ 
######## Commands ##########
############################

# Build
# docker build -t hb/notifications .

# Run
# docker run -p 3000:3000 hb/notifications

# List Containers
# docker ps

# Stop
# docker stop [ID]

# Remove
# docker rm [ID]


