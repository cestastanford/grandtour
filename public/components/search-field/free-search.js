const DEFAULT_OPERATOR = "or";

export default function () {

    return {

        restrict: 'E',
        template: require('pug-loader!./free-search.pug'),
        scope: true,
        link: function (scope) {


            /*
            *   Links model to main search query.
            */

            function resetFreeSearch() {

                if (scope.query.entry) scope.freeSearchModel = scope.query.entry
                else scope.freeSearchModel = {
                    terms: [{ value: '', beginning: true, end: true }],
                    sections: [
                        { key: 'biography', name: 'Biography', checked: true },
                        { key: 'narrative', name: 'Narrative', checked: true },
                        { key: 'tours', name: 'Tours', checked: true },
                        { key: 'notes', name: 'Notes', checked: true },
                    ],
                    operator: DEFAULT_OPERATOR
                }

            }


            /*
            *   Updates the free search model and main query in
            *   response to $watch or manual update.
            */

            function handleFreeSearchUpdate() {

                var terms = scope.freeSearchModel.terms.filter(function (term) { return term.value })
                if (terms.length) {

                    scope.query.entry = {
                        terms: terms,
                        sections: scope.freeSearchModel.sections,
                        operator: scope.freeSearchModel.operator
                    }

                } else delete scope.query.entry

            }


            /*
            *   Sets up free search model.
            */

            function setupFreeSearch() {

                resetFreeSearch();
                scope.$watch('freeSearchModel', handleFreeSearchUpdate, true)
                scope.$watch('query.entry', resetFreeSearch, true)

            }

            setupFreeSearch()

        },

    }

};