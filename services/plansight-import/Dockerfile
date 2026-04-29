FROM node:20-bullseye

RUN apt-get update && apt-get install -y maven openjdk-17-jdk && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

RUN cd parser-java && mvn -q package
RUN npm install
RUN npm --workspace backend run build

ENV SAMPLE_PROJECTS_DIR=/app/sample_projects
ENV MPP_PARSER_JAR=/app/parser-java/target/mpp-parser-cli-1.0.0-jar-with-dependencies.jar

WORKDIR /app

CMD npm --workspace backend run start