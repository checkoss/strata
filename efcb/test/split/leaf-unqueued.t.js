require('./proof')(3, prove)

function prove (async, okay) {
    var strata = createStrata({ directory: tmp, leafSize: 3, branchSize: 3 })
    async(function () {
        serialize(__dirname + '/fixtures/leaf-remainder.before.json', tmp, async())
    }, function () {
        strata.open(async())
    }, function () {
        gather(strata, async())
    }, function (records) {
        okay(records, [ 'a', 'c', 'd', 'e', 'f', 'g', 'h' ], 'records')
        strata.balance(async())
    }, function () {
        gather(strata, async())
    }, function (records) {
        okay(records, [ 'a', 'c', 'd', 'e', 'f', 'g', 'h' ], 'records after balance')

        vivify(tmp, async())
        load(__dirname + '/fixtures/leaf-remainder.before.json', async())
    }, function (actual, expected) {
        okay(actual, expected, 'split')
    }, function() {
        strata.close(async())
    })
}
