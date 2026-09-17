// JSON fetch with the error shape the routes report on: { status, data }.
const request = async (url, { params, ...init } = {}) => {
  // axios dropped absent params; URLSearchParams would send them as "undefined"
  const target = params
    ? `${url}?${new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
      )}`
    : url;

  const response = await fetch(target, init);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // `url` and not `target` on purpose: the API keys live in `params`, so `target`
    // carries them in its query string and every route prints this message with
    // console.error — straight into the same stdout Render keeps.
    throw Object.assign(new Error(`${response.status} ${url}`), {
      status: response.status,
      data,
    });
  }

  return data;
};

module.exports = { request };
