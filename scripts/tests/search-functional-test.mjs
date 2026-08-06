const baseUrl = process.env.TEST_BASE_URL || "http://localhost:4173";
const email = process.env.TEST_ADMIN_EMAIL;
const password = process.env.TEST_ADMIN_PASSWORD;

if (!email || !password) {
  throw new Error("Defina TEST_ADMIN_EMAIL e TEST_ADMIN_PASSWORD para executar o teste.");
}

function cookieHeaderFrom(response) {
  const raw = response.headers.getSetCookie?.() ?? [];
  return raw.map((cookie) => cookie.split(";")[0]).join("; ");
}

async function request(path, init = {}, cookie = "") {
  const response = await fetch(new URL(path, baseUrl), {
    redirect: "manual",
    ...init,
    headers: {
      accept: "application/json",
      origin: baseUrl,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(cookie ? { cookie } : {}),
      ...init.headers,
    },
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Keep raw text for diagnostics.
  }
  return { status: response.status, json, text, cookie: cookieHeaderFrom(response) };
}

async function assertOk(name, result, expected = 200) {
  if (result.status !== expected) {
    throw new Error(`${name}:${result.status}:${result.text}`);
  }
}

const login = await request("/api/auth/sign-in/email", {
  method: "POST",
  body: JSON.stringify({ email, password, rememberMe: true }),
});
await assertOk("login", login);
if (!login.cookie) throw new Error("login:cookie ausente");

const shortQuery = await request("/api/search?q=m", {}, login.cookie);
await assertOk("shortQuery", shortQuery);

const userSearch = await request("/api/search?q=matheus", {}, login.cookie);
await assertOk("userSearch", userSearch);

const invalidAnonymous = await request("/api/search?q=matheus");
await assertOk("anonymous", invalidAnonymous, 401);

const shortQueryValid =
  shortQuery.json?.query === "m" &&
  Array.isArray(shortQuery.json?.results) &&
  shortQuery.json.results.length === 0;
const userSearchValid =
  userSearch.json?.query === "matheus" && Array.isArray(userSearch.json?.results);

console.log(
  JSON.stringify(
    {
      login: login.status,
      shortQuery: shortQuery.status,
      userSearch: userSearch.status,
      anonymous: invalidAnonymous.status,
      shortQueryValid,
      userSearchValid,
      resultCount: userSearch.json?.results?.length ?? 0,
    },
    null,
    2,
  ),
);

if (!shortQueryValid || !userSearchValid) {
  process.exitCode = 1;
}
