// Perfect Corp YouCam API client. Implements the task-based async pattern
// documented in docs/api-integration.md.
//
// Endpoint segments and task payload shapes verified against the YouCam MCP
// catalog (2026-08-21). Task params sit at the TOP LEVEL of the task body
// next to src_file_id — not nested under a "params" key.

const PC_BASE = "https://yce-api-01.makeupar.com";
const PC_KEY = Deno.env.get("PERFECTCORP_API_KEY");

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${PC_KEY}`,
    "Content-Type": "application/json",
  };
}

interface FileRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
}

interface RegisterResponse {
  result?: {
    files: Array<{
      file_id: string;
      requests: FileRequest[];
    }>;
  };
}

interface TaskCreateResponse {
  result?: { task_id: string };
}

interface PollResponse {
  result?: {
    status?: string;
    results?: Array<{ url?: string; data?: { url?: string } }>;
  };
  status?: string;
}

export interface TaskFile {
  bytes: Uint8Array;
  contentType: string;
  fileName: string;
}

export interface RunTaskOptions {
  /** Feature name segment in the URL, e.g. "photo-background-removal". */
  featureName: string;
  bytes: Uint8Array;
  contentType: string;
  fileName: string;
  /**
   * Optional second file (e.g. the reference image for mu-transfer).
   * Registered alongside the source file; its id is sent as ref_file_id.
   */
  refFile?: TaskFile;
  /** Extra params merged into the task-creation body (after src_file_id). */
  taskParams?: Record<string, unknown>;
}

async function registerAndUpload(
  featureName: string,
  files: TaskFile[],
): Promise<string[]> {
  const regRes = await fetch(`${PC_BASE}/s2s/v2.0/file/${featureName}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      files: files.map((f) => ({
        content_type: f.contentType,
        file_name: f.fileName,
        file_size: f.bytes.length,
      })),
    }),
  });
  if (!regRes.ok) {
    throw new Error(`pc file register ${regRes.status}: ${await regRes.text()}`);
  }
  const regJson = (await regRes.json()) as RegisterResponse;
  console.log("pc register:", JSON.stringify(regJson));
  const entries = regJson.result?.files ?? [];
  if (entries.length !== files.length) {
    throw new Error(`unexpected register response: ${JSON.stringify(regJson)}`);
  }

  const ids: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const uploadReq = entry.requests?.[0];
    if (!entry.file_id || !uploadReq?.url) {
      throw new Error(`unexpected register entry: ${JSON.stringify(entry)}`);
    }
    const upRes = await fetch(uploadReq.url, {
      method: uploadReq.method ?? "PUT",
      headers: uploadReq.headers ?? { "Content-Type": files[i].contentType },
      body: files[i].bytes,
    });
    if (!upRes.ok) {
      throw new Error(`pc upload ${upRes.status}: ${await upRes.text()}`);
    }
    ids.push(entry.file_id);
  }
  return ids;
}

/**
 * Uploads bytes to Perfect Corp, creates a task, polls until success.
 * Returns every result URL the task produced (valid ~24h). Most features
 * return one; aging returns a series.
 */
export async function runPerfectCorpTaskAll(opts: RunTaskOptions): Promise<string[]> {
  if (!PC_KEY) throw new Error("PERFECTCORP_API_KEY not set");
  const { featureName, bytes, contentType, fileName, refFile, taskParams } = opts;

  // 1+2. Register file(s), upload bytes to presigned URLs
  const files: TaskFile[] = [{ bytes, contentType, fileName }];
  if (refFile) files.push(refFile);
  const ids = await registerAndUpload(featureName, files);

  // 3. Create task
  const body: Record<string, unknown> = { src_file_id: ids[0], ...(taskParams ?? {}) };
  if (refFile) body.ref_file_id = ids[1];
  const taskRes = await fetch(`${PC_BASE}/s2s/v2.0/task/${featureName}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!taskRes.ok) {
    throw new Error(`pc task create ${taskRes.status}: ${await taskRes.text()}`);
  }
  const taskJson = (await taskRes.json()) as TaskCreateResponse;
  console.log("pc task create:", JSON.stringify(taskJson));
  const taskId = taskJson.result?.task_id;
  if (!taskId) throw new Error(`no task_id in response: ${JSON.stringify(taskJson)}`);

  // 4. Poll. Backoff per docs/api-integration.md: 1s, 2s, 3s, 5s, 5s... up to ~60s.
  const delays = [1000, 2000, 3000, 5000, 5000, 5000, 5000, 10000, 10000, 10000];
  let last: PollResponse | null = null;
  for (let i = 0; i < delays.length; i++) {
    await new Promise((r) => setTimeout(r, delays[i]));
    const pRes = await fetch(`${PC_BASE}/s2s/v2.0/task/${featureName}/${taskId}`, {
      headers: authHeaders(),
    });
    if (!pRes.ok) throw new Error(`pc poll ${pRes.status}: ${await pRes.text()}`);
    const pJson = (await pRes.json()) as PollResponse;
    last = pJson;
    console.log(`pc poll ${i + 1}:`, JSON.stringify(pJson));
    const status = pJson.result?.status ?? pJson.status;
    if (status === "success") {
      const urls = (pJson.result?.results ?? [])
        .map((r) => r.url ?? r.data?.url)
        .filter((u): u is string => typeof u === "string" && u.length > 0);
      if (urls.length === 0) {
        throw new Error(`success but no result url: ${JSON.stringify(pJson)}`);
      }
      return urls;
    }
    if (status === "error" || status === "failed") {
      throw new Error(`pc task failed: ${JSON.stringify(pJson)}`);
    }
  }
  throw new Error(`pc task timeout; last: ${JSON.stringify(last)}`);
}

/**
 * Single-result convenience wrapper: returns the first result URL.
 */
export async function runPerfectCorpTask(opts: RunTaskOptions): Promise<string> {
  const urls = await runPerfectCorpTaskAll(opts);
  return urls[0];
}
