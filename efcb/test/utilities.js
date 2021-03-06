var fs = require('fs')
var path = require('path')

var Staccato = require('staccato')

var Appender = require('../appender')

var shifter = require('./shifter')(null)

var cadence = require('cadence')
var ascension = require('ascension')

var rimraf = require('rimraf')
var mkdirp = require('mkdirp')

exports.directory = path.resolve(__dirname, './tmp')

exports.reset = cadence(function (async, directory) {
    async(function () {
        rimraf(directory, async())
    }, function () {
        mkdirp(directory, async())
    })
})

var appendable = ascension([ Number, Number ], function (file) {
    return file.split('.')
})

exports.vivify = cadence(function (async, directory) {
    var vivified = {}
    async(function () {
        fs.readdir(path.resolve(directory, 'pages'), async())
    }, function (files) {
        async.forEach([ files ], function (file) {
            if (!/^\d+.\d+$/.test(file)) {
                return [ async.continue ]
            }
            async(function () {
                fs.readdir(path.resolve(directory, 'pages', file), async())
            }, function (dir) {
                var append = dir.filter(function (file) {
                    return /^\d+\.\d+$/.test(file)
                }).sort(appendable).pop()
                fs.readFile(path.resolve(directory, 'pages', file, append), 'utf8', async())
            }, function (entries) {
                entries = entries.split(/\n/)
                console.log(entries)
                entries.pop()
                entries = entries.map(function (entry) { return JSON.parse(entry) })
                if (+file.split('.')[1] % 2 == 1) {
                    var records = []
                    while (entries.length != 0) {
                        var record = shifter(entries), header = record[0]
                        switch (header.method) {
                        case 'insert':
                            records.push({ method: header.method, index: header.index, body: record[1] })
                            break
                        case 'remove':
                            records.push({ method: header.method, index: header.index })
                            break
                        }
                    }
                    vivified[file] = records
                } else {
                    var records = []
                    while (entries.length != 0) {
                        var record = shifter(entries), header = record[0]
                        switch (header.method) {
                        case 'insert':
                            records.splice(header.index, 0, header.value.id)
                            break
                        }
                    }
                    vivified[file] = records
                }
            })
        })
    }, function () {
        return [ vivified ]
    })
})

exports.serialize = cadence(function (async, directory, files) {
    var instance = 0
    async(function () {
        async.forEach([ Object.keys(files) ], function (id) {
            async(function () {
                mkdirp(path.resolve(directory, 'pages', id), async())
            }, function () {
                var appender = new Appender(path.resolve(directory, 'pages', id, '0.0'))
                async(function () {
                    instance = Math.max(+id.split('.')[0], instance)
                    if (+id % 2 == 0) {
                        async.forEach([ files[id] ], function (child, index) {
                            appender.append({
                                method: 'insert',
                                index: index,
                                value: { id: child }
                            }, async())
                        })
                    } else {
                        async.forEach([ files[id] ], function (record, index) {
                            appender.append({
                                method: record.method,
                                index: record.index
                            }, {
                                key: record.body,
                                value: record.body
                            }, async())
                        })
                    }
                }, function () {
                    appender.end(async())
                })
            })
        })
    }, function () {
        mkdirp(path.resolve(directory, 'instance', String(instance)), async())
    })
})
