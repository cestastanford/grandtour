export default function ($http, $q) {
    return function (url) {
        var cancelQuery = null;
        return function runQuery(query) {
            // if we were running a query before,
            // cancel it so it doesn't invoke its success callback
            if (cancelQuery) {
                cancelQuery.resolve();
            }
            cancelQuery = $q.defer();
            return $http.
                post(url, { query: query }, { timeout: cancelQuery.promise })
                .then(function (response) {
                    cancelQuery = null;
                    return response.data;
                });
        };
    };
};