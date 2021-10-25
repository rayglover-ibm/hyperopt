// @ts-check
const { equal, ok, throws } = require('assert').strict;
const hyperopt = require('..');
const { closeTo } = require('./util');

/** @typedef {import('..').DomainVariable} DomainVariable */

function assertSolverResult(result, len) {
    equal(typeof result.y, 'number');
    equal(typeof result.x, 'object');
    equal(result.x.length, len);

    for (let i = 0; i < len; i++) {
        equal(typeof result.x[i], 'number');
        ok(Number.isFinite(result.x[i]));
    }
}

const objectives = {
    sin: (min, max, m) => {
        equal(typeof m, 'object');
        equal(m.length, 1);

        ok(m[0] >= min);
        ok(m[0] <= max);

        return Math.sin(m[0]);
    },
    rosen: (b, m) => {
        equal(typeof m, 'object');
        equal(m.length, 2);

        const [x, y] = m;

        // Rosenbrock's function
        return Math.pow(1 - x, 2) + b * Math.pow(y - (x * x), 2);
    },
    intProduct: (m) => {
        let sum = 0;
        for (let i = 0; i < m.length; i++) {
            // values of m should be integers
            closeTo(m[i], Math.round(m[i]), 1e-20);
            sum += m[i];
        }
        return sum;
    }
}

const tests = {
    'Find sin(x) global maximum (-3, 3)': () => {
        const tol = 1e-8;
        const objective = objectives.sin.bind(null, -3, 3);
        const result = hyperopt.findMaxGlobal(
            objective, [[-3, 3]], { maxIterations: 20 });

        assertSolverResult(result, 1);

        closeTo(result.x[0], Math.PI / 2, tol);
        closeTo(result.y, 1, tol);
    },

    'Find sin(x) global minimum (-3, 3)': () => {
        const tol = 1e-8;
        const objective = objectives.sin.bind(null, -3, 3)
        const result = hyperopt.findMinGlobal(
            objective, [[-3, 3]], { maxIterations: 20 });

        assertSolverResult(result, 1);

        closeTo(result.x[0], Math.PI / -2, tol);
        closeTo(result.y, -1, tol);
    },

    'Find rosen(x, y) global minimum (b = 100)': () => {
        const objective = objectives.rosen.bind(null, 100);

        // Avoid bounds centred at (0, 0) to
        // make this more challenging
        /** @type {DomainVariable[]} */
        const bounds = [[-3.1, 6.51], [-5.2, 3.3]];
        const result = hyperopt.findMinGlobal(objective, bounds, { maxIterations: 250 });

        assertSolverResult(result, 2);

        closeTo(result.x[0], 1, 1e-8);
        closeTo(result.x[1], 1, 1e-8);
        closeTo(result.y, 0, 1e-16);
    },

    'Find rosen(x, y) global minimum (b = 100) within duration': () => {
        const objective = objectives.rosen.bind(null, 100);
        const maxRuntimeMs = 500;

        /** @type {DomainVariable[]} */
        const bounds = [[-3.1, 6.51], [-5.2, 3.3]];

        const t1 = Date.now();
        const result = hyperopt.findMinGlobal(objective, bounds, { maxRuntimeMs });

        closeTo(Date.now() - t1, maxRuntimeMs, maxRuntimeMs * 0.25);
        closeTo(result.y, 0, 1);
    },

    'Find max integer product': () => {        
        const objective = objectives.intProduct;

        /** @type {DomainVariable[]} */
        const domain = [
            { bounds: [1, 3], isInteger: true },
            { bounds: [0, 1], isInteger: true },
            { bounds: [-1, 2], isInteger: true }
        ];

        const result = hyperopt.findMaxGlobal(objective, domain, { maxIterations: 10, epsilon: 1 });
        closeTo(result.x[0], 3, 1e-20);
        closeTo(result.x[1], 1, 1e-20);
        closeTo(result.x[2], 2, 1e-20);
        closeTo(result.y, 6, 1e-20);
    },

    'Readme example 1': () => {
        /** @type {DomainVariable[]} */
        const domain = [
            [0, 3.5]
        ];

        const objective = xs => {
            const x = xs[0];
            return (1 / x) * Math.sin(x ** 2);
        }

        const min = hyperopt.findMinGlobal(objective, domain,
            { maxIterations: 10 });

        closeTo(min.y, -0.463, 1e-3);
        closeTo(min.x[0], 2.144, 1e-3);
    },

    'Handles Bad objectives': () => {
        throws(() => hyperopt.findMaxGlobal(null,       [[0, 1]]));
        // @ts-expect-error
        throws(() => hyperopt.findMaxGlobal({},         [[0, 1]]));
        // @ts-expect-error
        throws(() => hyperopt.findMaxGlobal(_ => [0],   [[0, 1]]));
        // @ts-expect-error
        throws(() => hyperopt.findMaxGlobal(_ => false, [[0, 1]]));
        
        throws(() => hyperopt.findMaxGlobal(_ => NaN,   [[0, 1]], { maxIterations: 10 }));
    },

    'Handles Bad domains': () => {
        throws(() => hyperopt.findMaxGlobal(_ => 0, null));
        
        throws(() => hyperopt.findMaxGlobal(_ => 0, []));
        // @ts-expect-error
        throws(() => hyperopt.findMaxGlobal(_ => 0, [0]));
        // @ts-expect-error
        throws(() => hyperopt.findMaxGlobal(_ => 0, [{ bounds: 0 }]));
        
        throws(() => hyperopt.findMaxGlobal(_ => 0, [{ bounds: [0.1, 2], isInteger: true }]));
    }
}

module.exports = tests;
