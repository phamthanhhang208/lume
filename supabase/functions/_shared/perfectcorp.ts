// Perfect Corp YouCam API client. Implements the task-based async pattern
// documented in docs/api-integration.md.

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

interface RegisterPayload {
  files: Array<{
    file_id: string;
    requests: FileRequest[];
  }>;
}

interface RegisterResponse {
  result?: RegisterPayload;
  data?: RegisterPayload;
}

interface TaskCreatePayload {
  task_id: string;
}

interface TaskCreateResponse {
  result?: TaskCreatePayload;
  data?: TaskCreatePayload;
}

// PC v2.0 returns `results` as a single object; v1.0 (and some endpoints)
// return an array. We accept both shapes.
type PollResultEntry = { url?: string; data?: { url?: string } };

interface PollPayload {
  // v2.0 uses `task_status`; older docs and v1.0 use `status`. Accept either.
  task_status?: string;
  status?: string;
  results?: PollResultEntry | PollResultEntry[];
}

interface PollResponse {
  result?: PollPayload;
  data?: PollPayload;
  status?: string;
}

export interface RunTaskOptions {
  /** Feature name segment in the URL, e.g. "photo-background-removal". */
  featureName: string;
  bytes: Uint8Array;
  contentType: string;
  fileName: string;
  /** Extra params merged into the task-creation body (after src_file_id). */
  taskParams?: Record<string, unknown>;
}

/**
 * Uploads bytes to Perfect Corp, creates a task, polls until success.
 * Returns the result URL produced by Perfect Corp (valid ~24h).
 */
export async function runPerfectCorpTask(opts: RunTaskOptions): Promise<string> {
  if (!PC_KEY) throw new Error("PERFECTCORP_API_KEY not set");
  const { featureName, bytes, contentType, fileName, taskParams } = opts;

  // 1. Register file (get presigned upload URL + file_id)
  const regRes = await fetch(`${PC_BASE}/s2s/v2.0/file/${featureName}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      files: [{ content_type: contentType, file_name: fileName, file_size: bytes.length }],
    }),
  });
  if (!regRes.ok) {
    throw new Error(`pc file register ${regRes.status}: ${await regRes.text()}`);
  }
  const regJson = (await regRes.json()) as RegisterResponse;
  console.log("pc register:", JSON.stringify(regJson));
  const regPayload = regJson.data ?? regJson.result;
  const fileEntry = regPayload?.files?.[0];
  const fileId = fileEntry?.file_id;
  const uploadReq = fileEntry?.requests?.[0];
  if (!fileId || !uploadReq?.url) {
    throw new Error(`unexpected register response: ${JSON.stringify(regJson)}`);
  }

  // 2. Upload bytes to presigned URL
  const upRes = await fetch(uploadReq.url, {
    method: uploadReq.method ?? "PUT",
    headers: uploadReq.headers ?? { "Content-Type": contentType },
    body: bytes,
  });
  if (!upRes.ok) {
    throw new Error(`pc upload ${upRes.status}: ${await upRes.text()}`);
  }

  // 3. Create task
  const taskRes = await fetch(`${PC_BASE}/s2s/v2.0/task/${featureName}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ src_file_id: fileId, ...(taskParams ?? {}) }),
  });
  if (!taskRes.ok) {
    throw new Error(`pc task create ${taskRes.status}: ${await taskRes.text()}`);
  }
  const taskJson = (await taskRes.json()) as TaskCreateResponse;
  console.log("pc task create:", JSON.stringify(taskJson));
  const taskId = (taskJson.data ?? taskJson.result)?.task_id;
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
    const pollPayload = pJson.data ?? pJson.result;
    const status =
      pollPayload?.task_status ?? pollPayload?.status ?? pJson.status;
    if (status === "success") {
      const results = pollPayload?.results;
      const firstResult = Array.isArray(results) ? results[0] : results;
      const url = firstResult?.url ?? firstResult?.data?.url;
      if (!url) throw new Error(`success but no result url: ${JSON.stringify(pJson)}`);
      return url;
    }
    if (status === "error" || status === "failed") {
      throw new Error(`pc task failed: ${JSON.stringify(pJson)}`);
    }
  }
  throw new Error(`pc task timeout; last: ${JSON.stringify(last)}`);
}
