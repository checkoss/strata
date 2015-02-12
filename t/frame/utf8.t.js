#!/usr/bin/env node

require('proof')(6, prove)

function prove (assert) {
    var json = require('../../json')
    var Queue = require('../../queue')
    var Framer = require('../../frame/utf8')
    var framer = new Framer('sha1')
    var queue = new Queue
    var length = framer.serialize(json.serializer, queue, [ 1, 2, 3 ], { a: 1 })
    assert(length, 60, 'bodied length')
    queue.finish()
    var buffer = queue.buffers.shift()
    var entry = framer.deserialize(json.deserialize, buffer, 0, buffer.length)
    assert(framer.length(buffer, 0, buffer.length), 60, 'bodied read length')
    assert(entry, { length: 60, heft: 7, header: [ 1, 2, 3 ], body: { a: 1 } }, 'bodied')
    var queue = new Queue
    var length = framer.serialize(json.serializer, queue, [ 1, 2, 3 ])
    assert(length, 52, 'unbodied length')
    queue.finish()
    var buffer = queue.buffers.shift()
    assert(framer.length(buffer, 0, buffer.length), 52, 'unbodied read length')
    var entry = framer.deserialize(json.deserialize, buffer, 0, buffer.length)
    assert(entry, { length: 52, heft: null, header: [ 1, 2, 3 ], body: null }, 'unbodied')
}
