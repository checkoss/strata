require('proof')(3, async (okay) => {
    const Destructible = require('destructible')

    const Strata = require('../strata')
    const Cache = require('../cache')

    const utilities = require('../utilities')
    const path = require('path')
    const directory = path.join(utilities.directory, 'fill')
    await utilities.reset(directory)
    await utilities.serialize(directory, {
        '0.0': [[ '0.2', null ], [ '0.4', 'f' ]],
        '0.2': [[ '0.1', null ], [ '0.3', 'c' ]],
        '0.4': [[ '0.5', null ], [ '0.7', 'i' ]],
        '0.1': [[
            'right', 'c'
        ], [
            'insert', 0, 'a'
        ], [
            'insert', 1, 'b'
        ]],
        '0.3': [[
            'right', 'f'
        ], [
            'insert', 0, 'c'
        ], [
            'insert', 1, 'd'
        ], [
            'insert', 2, 'e'
        ]],
        '0.5': [[
            'right', 'i'
        ], [
            'insert', 0, 'f'
        ], [
            'insert', 1, 'g'
        ], [
            'insert', 2, 'h'
        ]],
        '0.7': [[
            'insert', 0, 'i'
        ], [
            'insert', 1, 'j'
        ], [
            'insert', 2, 'k'
        ]]
    })

    // Merge
    {
        const cache = new Cache
        const strata = new Strata(new Destructible('merge'), { directory, cache })
        await strata.open()
        const cursor = await strata.search('b')
        // TODO Come back and insert an error into `remove`. Then attempt to
        // resolve that error somehow into `flush`. Implies that Turnstile
        // propagates an error. Essentially, how do you get the foreground
        // to surrender when the background has failed. `flush` could be
        // waiting on a promise when the background fails and hang
        // indefinately. Any one error, like a `shutdown` error would stop
        // it.
        const { index } = cursor.indexOf('b')
        const writes = {}
        cursor.remove(index, writes)
        cursor.release()
        Strata.flush(writes)
        await strata.destructible.destroy().rejected
        cache.purge(0)
        okay(cache.heft, 0, 'cache purged')
    }
    // Reopen.
    {
        const cache = new Cache
        const strata = new Strata(new Destructible('reopen'), { directory, cache })
        await strata.open()
        const cursor = await strata.search('c')
        const { index } = cursor.indexOf('c')
        okay(cursor.page.items[index].parts[0], 'c', 'found')
        cursor.release()
        await strata.destructible.destroy().rejected
    }
    // Traverse.
    {
        const cache = new Cache
        const strata = new Strata(new Destructible('traverse'), { directory, cache })
        await strata.open()
        let right = 'a'
        const items = []
        do {
            const cursor = await strata.search(right)
            const { index } = cursor.indexOf(right)
            for (let i = index; i < cursor.page.items.length; i++) {
                items.push(cursor.page.items[i].parts[0])
            }
            cursor.release()
            right = cursor.page.right
        } while (right != null)
        okay(items, [ 'a', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k' ], 'traverse')
        await strata.destructible.destroy().rejected
    }
})
