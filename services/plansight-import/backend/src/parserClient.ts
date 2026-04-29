import { spawn } from "node:child_process";
import path from "node:path";
import type { ParsedProject } from "./types.js";

const DEFAULT_PARSER_JAR = path.resolve(
  process.cwd(),
  "../parser-java/target/mpp-parser-cli-1.0.0-jar-with-dependencies.jar"
);

export async function parseMppFile(filePath: string): Promise<ParsedProject> {
  const parserJar = process.env.MPP_PARSER_JAR ?? DEFAULT_PARSER_JAR;
  const javaBin = process.env.JAVA_BIN ?? "java";

  return new Promise((resolve, reject) => {
    const child = spawn(javaBin, ["-jar", parserJar, filePath], {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      reject(
        new Error(
          `Failed to start Java parser process: ${error.message}. Verify Java and parser jar path (${parserJar}).`
        )
      );
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `MPP parser failed with exit code ${code}. ${stderr.trim() || "No stderr output from parser."}`
          )
        );
        return;
      }

      try {
        const jsonText = extractJsonObject(stdout);
        const parsed = JSON.parse(jsonText) as ParsedProject;
        resolve(parsed);
      } catch (error) {
        reject(
          new Error(
            `Failed to parse parser output JSON: ${
              error instanceof Error ? error.message : "unknown error"
            }. Raw output: ${stdout.slice(0, 500)}`
          )
        );
      }
    });
  });
}

function extractJsonObject(rawOutput: string): string {
  const firstBrace = rawOutput.indexOf("{");
  const lastBrace = rawOutput.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("No JSON object found in parser stdout");
  }

  return rawOutput.slice(firstBrace, lastBrace + 1);
}
