/**
 * Fixes `instanceof Error` in jest. The fix does not affect anything else -
 * not even `instanceof SomeSubClassOfError`.
 *
 * The problem is that jest runs tests in a separate vm (context).
 * Each vm has its own globals, for example Error. In some cases,
 * an object from a different vm enters the test vm. It has different
 * objects in the prototype chain, so `instanceof` does not work as expected.
 * See https://github.com/facebook/jest/issues/2549#issuecomment-423202304.
 */
Object.defineProperty(Error, Symbol.hasInstance, {
    value: function(value) {
        if (this === Error) {
            return Object.prototype.toString.call(value) === '[object Error]'
        } else {
            return Object.getPrototypeOf(Error)[Symbol.hasInstance].call(
                this,
                value,
            )
        }
    },
})
