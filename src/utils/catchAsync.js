/**
 * catchAsync -> wraps async controllers to avoid repetitive try/catch blocks.
 *
 * Without this, every controller needs its own try/catch just to call next(error).
 * With this, any error thrown inside the controller (or any rejected promise)
 * is automatically forwarded to the global error handler.
 *
 * Usage: router.get("/", catchAsync(myController))
 */
function catchAsync(controllerFunction) {
    return function (req, res, next) {
        controllerFunction(req, res, next).catch(next)
    }
}

module.exports = catchAsync
