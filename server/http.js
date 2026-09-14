// JSON fetch with the error shape the routes report on: { status, data }.
const request = async (url, { params, ...init } = {}) => {
  let target = url;

  if (params) {
    // axios omitted empty params; URLSearchParams would send "undefined"
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
    );
    target = `${url}?${query}`;
  }

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
