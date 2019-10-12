const { ok } = require('assert').strict;

function closeTo(x, y, absolute) {
    const within = Math.abs(x - y) <= absolute;
    ok(within, `${x} should be close to ${y} (tol = ${absolute})`);
}

exports.closeTo = closeTo;
