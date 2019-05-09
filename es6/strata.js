const Journalist = require('./journalist')
const Cursor = require('./cursor')

class Unlocker {
    constructor (cursor) {
        this._cursor = cursor
        cursor._page.lock = new Promise(resolve => this._lock = resolve)
    }

    get () {
        if (this._lock != null) {
            this._lock.call()
            this._lock = null
        }
        return this._cursor
    }
}

class Strata {
    constructor (options) {
        this.journalist = new Journalist(options)
    }

    create () {
        return this.journalist.create()
    }

    open () {
        return this.journalist.open()
    }

    async search (key) {
        DESCEND: for (;;) {
            const descent = await this.journalist.descend(key, -1, 0)
            const cursor = new Cursor(this._journalist, descent, key)
            UNLOCK: while (cursor._page.lock != null) {
                descent.entries.forEach(entry => entry.release())
                await page.lock
                if ((cursor.index = cursor.indexOf(key, 0)) == null) {
                    cursor.release()
                    continue DESCEND
                }
                continue UNLOCK
            }
            return new Unlocker(cursor)
        }
    }

    close () {
        return this.journalist.close()
    }
}

module.exports = Strata
