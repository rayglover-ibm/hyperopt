const hyperopt = require('..');
const { sample, sd } = require('./data');
const { closeTo } = require('./util');

const PI_SQRT = Math.sqrt(Math.PI);
const INV_2PI = 1 / Math.sqrt(2 * Math.PI);
const INV_4PI = 1 / Math.sqrt(4 * Math.PI);

/** Gaussian kernel, mean = 0, variance = 1 */
function gaussian(x) {
    return INV_2PI * Math.exp(-0.5 * x * x);
}

/**  */
function gaussianHat(x) {
    return INV_4PI * Math.exp(-0.25 * x * x);
}

function kde(kernel, sample, h, x) {
    const n = sample.length;
    const hNorm = 1 / h;
    const kNorm = 1 / (n * h);

    let sum = 0;
    for (let i = 0; i < n; i++) {
        sum += kNorm * kernel(hNorm * (sample[i] - x));
    }
    return sum;
}

/**
 * A cost function for selection of a gaussian kernel bandwidth by
 * least squares cross-validation. References: Rudemo (1982),
 * Stone (1984) and Bowman (1984)
 *
 * @returns The mean integrated squared error (MISE) of the resulting
 * density es­timate of the given sample and bandwidth, h.
 */
function mise(sample, h) {
    const hNorm = 1 / h;
    const n = sample.length;

    let sum = 0;
    for (let i = 0; i < n; i++) {
        const xi = sample[i];

        for (let j = i + 1; j < n; j++) {
            const x = (xi - sample[j]) * hNorm;
            sum += 4 * PI_SQRT * (gaussianHat(x) - 2 * gaussian(x));
        }
    }

    return (n + sum) / h;
}

/**
 * A cost function for Maximum likelihood cross-validation
 * of a density estimate
 */
function mlcv(kernel, sample, h) {
    const n = sample.length;
    const hNorm = 1 / h;

    let cvSum = 0;
    for (let i = 0; i < n; i++) {
        const xi = sample[i];

        let q = 0;
        for (let j = 0; j < n; j++) {
            q += kernel(hNorm * (sample[j] - xi));
        }

        cvSum += Math.log(q - kernel(0));
    }

    return (1 / n) * cvSum - Math.log((n - 1) * h);
}

const tests = {
    'Silverman`s rule': () => {
        // Determine a kernel bandwidth based on Silverman's (1986)
        // rule of thumb. Assumes the underlying density being estimated
        // is gaussian (it isn't.)
        const n = sample.length;
        const h = (0.9 * sd) / (n ** 0.2);

        // Find the location of the highest density in the data,
        // with a gaussian kernel
        const density = kde.bind(null, gaussian, sample, h);
        const densityMax = hyperopt.findMaxGlobal(([x]) => density(x),
            [[40, 100]], { maxIterations: 15 });

        console.info(`Bandwidth = ${ h },\nmax. density = ${ densityMax.x[0] }`);
    },

    'Least squares cross validation (lscv)': () => {
        const cost = mise.bind(null, sample);
        const miseMin = hyperopt.findMinGlobal(
            ([h]) => cost(h), [[0.5, 50]], { maxIterations: 15, });

        const bandwidth = miseMin.x[0];
        closeTo(bandwidth, 2.658, 1e-3);

        const density = kde.bind(null, gaussian, sample, bandwidth);
        const densityMax = hyperopt.findMaxGlobal(
            ([x]) => density(x), [[40, 100]], { maxIterations: 15, });

        console.info(`Bandwidth = ${ bandwidth },\nmax. density = ${ densityMax.x[0] }`);
        closeTo(densityMax.x[0], 80.03, 1e-3);
    },

    'Maximum Likelihood cross validation (mlcv)': () => {
        const cost = mlcv.bind(null, gaussian, sample);
        const mlcvMin = hyperopt.findMaxGlobal(
            ([h]) => cost(h), [[0.5, 50]], { maxIterations: 15, });

        const bandwidth = mlcvMin.x[0];
        closeTo(bandwidth, 2.255, 1e-3);

        const density = kde.bind(null, gaussian, sample, bandwidth);
        const densityMax = hyperopt.findMaxGlobal(
            ([x]) => density(x), [[40, 100]], { maxIterations: 15, });

        console.info(`Bandwidth = ${ bandwidth },\nmax. density = ${ densityMax.x[0] }`);
        closeTo(densityMax.x[0], 80.206, 1e-3);
    }
}

module.exports = tests;
