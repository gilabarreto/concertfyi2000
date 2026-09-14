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
    throw Object.assign(new Error(`${response.status} ${url}`), {
      status: response.status,
      data,
    });
  }

  return data;
};

module.exports = { request };
