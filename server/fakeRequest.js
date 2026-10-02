// Só para os testes. Express de mentira: um router é chamável, só precisa de
// req.url/method e do res. Resolve com o status e o corpo do primeiro json().
module.exports = (router, url, query) =>
  new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      set() {
        return this;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        resolve({ status: this.statusCode, body });
        return this;
      },
    };
    router({ method: "GET", url, query, headers: {} }, res, reject);
  });
