// @ts-check
const hyperopt = require('..');
const { sample, mean, sd } = require('./data');
const { closeTo } = require('./util');

/** Probability Density function (PDF) for the Normal Distribution */
function pdf(x, loc, scale) {
    const q = Math.exp((-((x - loc) ** 2)) / ((2 * scale) ** 2));
    return (1 / Math.sqrt(2 * Math.PI * (scale ** 2))) * q;
}

/**
 * @returns the negative log likelihood of the given sample
 * for the normal distribution of the given mean and variance
 */
function negLogL(xs, loc, scale) {
    const n = xs.length;

    const a = (n / 2) * Math.log(2 * Math.PI);
    const b = (n / 2) * Math.log(scale ** 2);
    const c = (1 / (2 * (scale ** 2)))

    let sum = 0;
    for (let i = 0; i < n; i++) {
        sum += (xs[i] - loc) ** 2;
    }
    return -a - b - (c * sum);
}

const tests = {
    'pdf(x, mu, sigma)': () => {
        closeTo(pdf(3, 3, 1), 0.3989, 0.002);
        closeTo(pdf(3, 2, 7), 0.0567, 0.002);
    },

    'negLogL': () => {
        const xs = [9, 9.5, 11];
        closeTo(negLogL(xs, 9.833, 1), -3.84, 0.01);
    },

    'Maximum likelihood estimation': () => {
        /** @type {(xs: Iterable<number>) => number} */
        const logLik = ([loc, scale]) => negLogL(sample, loc, scale);

        const max = hyperopt.findMaxGlobal(
            logLik, [{ bounds: [40, 100] }, { bounds: [0.1, 50] }],
            { maxIterations: 20 });

        const [estMean, estSD] = max.x;

        closeTo(estMean, mean, 0.1);
        closeTo(estSD, sd, 0.1);

        console.info(`MLE mean = ${ mean }, sd = ${ sd }`);
    }
}

module.exports = tests;
