export const makeQueryChain = (promise) => {
  const chain = {
    then: (onFulfilled, onRejected) => promise.then(onFulfilled, onRejected),
    sort: (sortObj) => {
      const nextPromise = promise.then(data => {
        if (!data) return data;
        
        // Handle findOne sort (not array)
        if (!Array.isArray(data)) {
          return data;
        }

        const sorted = [...data];
        const keys = Object.keys(sortObj);
        
        sorted.sort((a, b) => {
          for (const key of keys) {
            let order = sortObj[key];
            if (typeof order === "string") {
              order = order.toLowerCase() === "desc" || order === "-1" ? -1 : 1;
            }
            let valA = a[key];
            let valB = b[key];

            // Normalize values for comparison
            if (valA instanceof Date) valA = valA.getTime();
            if (valB instanceof Date) valB = valB.getTime();
            if (typeof valA === "string" && !isNaN(Date.parse(valA))) valA = new Date(valA).getTime();
            if (typeof valB === "string" && !isNaN(Date.parse(valB))) valB = new Date(valB).getTime();

            if (valA === undefined || valA === null) return 1;
            if (valB === undefined || valB === null) return -1;

            if (valA < valB) return order === -1 ? 1 : -1;
            if (valA > valB) return order === -1 ? -1 : 1;
          }
          return 0;
        });
        return sorted;
      });
      return makeQueryChain(nextPromise);
    },
    limit: (n) => {
      const nextPromise = promise.then(data => {
        if (!Array.isArray(data)) return data;
        return data.slice(0, n);
      });
      return makeQueryChain(nextPromise);
    },
    skip: (n) => {
      const nextPromise = promise.then(data => {
        if (!Array.isArray(data)) return data;
        return data.slice(n);
      });
      return makeQueryChain(nextPromise);
    }
  };
  return chain;
};
