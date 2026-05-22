import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const rootArg = process.argv[2] ?? "out";
const port = Number(process.argv[3] ?? 4173);
const root = resolve(process.cwd(), rootArg);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0] ?? "/");
  const normalized = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return join(root, normalized);
}

async function resolveFile(urlPath) {
  const requested = safePath(urlPath);
  const candidates = [
    requested,
    join(requested, "index.html"),
    `${requested}.html`,
  ];

  for (const candidate of candidates) {
    if (!candidate.startsWith(root) || !existsSync(candidate)) continue;
    const info = await stat(candidate);
    if (info.isFile()) return { file: candidate, status: 200 };
  }

  const notFound = join(root, "404.html");
  if (existsSync(notFound)) return { file: notFound, status: 404 };
  return { file: join(root, "index.html"), status: 404 };
}

const server = createServer(async (request, response) => {
  try {
    const resolvedFile = await resolveFile(request.url ?? "/");
    if (!resolvedFile || !existsSync(resolvedFile.file)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const type = mimeTypes[extname(resolvedFile.file).toLowerCase()] ?? "application/octet-stream";
    response.writeHead(resolvedFile.status, {
      "Content-Type": type,
      "Cache-Control": "no-store",
    });
    createReadStream(resolvedFile.file).pipe(response);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : "Server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Japan Life offline preview: http://127.0.0.1:${port}/`);
});
