const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  cpp: 54,
  java: 62
};

const PUBLIC_JUDGE0_URL = "https://ce.judge0.com";
const RAPIDAPI_JUDGE0_URL = "https://judge0-ce.p.rapidapi.com";

function normalizeOutput(value) {
  return String(value || "").replace(/\r\n/g, "\n").trim();
}

function decodeBase64(value) {
  if (!value) return "";
  return Buffer.from(value, "base64").toString("utf8");
}

async function runOnJudge0({ code, language, stdin = "", expectedOutput = "" }) {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    throw new Error("Unsupported language");
  }

  let judgeUrl = String(process.env.JUDGE0_API_URL || "").trim();
  const hasRapidApiKey = Boolean(process.env.JUDGE0_RAPIDAPI_KEY);
  const usesRapidApiHost = judgeUrl.includes("rapidapi.com");

  const headers = {
    "Content-Type": "application/json"
  };

  if (hasRapidApiKey) {
    if (!judgeUrl) judgeUrl = RAPIDAPI_JUDGE0_URL;
    headers["x-rapidapi-key"] = process.env.JUDGE0_RAPIDAPI_KEY;
    headers["x-rapidapi-host"] = process.env.JUDGE0_RAPIDAPI_HOST || "judge0-ce.p.rapidapi.com";
  } else {
    // RapidAPI URLs require a key, so fall back to the public CE instance otherwise.
    if (!judgeUrl || usesRapidApiHost) judgeUrl = PUBLIC_JUDGE0_URL;
  }

  judgeUrl = judgeUrl.replace(/\/+$/, "");

  const res = await fetch(`${judgeUrl}/submissions?base64_encoded=true&wait=true`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      source_code: Buffer.from(code, "utf8").toString("base64"),
      language_id: languageId,
      stdin: Buffer.from(stdin, "utf8").toString("base64"),
      expected_output: Buffer.from(expectedOutput, "utf8").toString("base64")
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Judge0 failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const stdout = decodeBase64(data.stdout);
  const stderr = decodeBase64(data.stderr);
  const compileOutput = decodeBase64(data.compile_output);

  return {
    statusId: data.status?.id,
    statusDescription: data.status?.description || "Unknown",
    stdout,
    stderr,
    compileOutput,
    passed: normalizeOutput(stdout) === normalizeOutput(expectedOutput)
  };
}

module.exports = {
  LANGUAGE_IDS,
  runOnJudge0,
  normalizeOutput
};
