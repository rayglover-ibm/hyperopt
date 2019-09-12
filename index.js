/* 
 * Copyright 2017 Ray Glover
 * Licensed under the Apache License, Version 2.0 
 */

const binding = require('bindings')('hyperopt');

function extractBounds(bounds) {
    const min = new Float64Array(bounds.length);
    const max = new Float64Array(bounds.length);

    for (let i = 0; i < bounds.length; i++) {
        const [iMin, iMax] = bounds[i];

        min[i] = iMin;
        max[i] = iMax;
    }

    return { min, max };
}

function run(objective, bounds, opts, ymult) {
    if (typeof objective !== 'function')
        throw new Error('The objective must be a function');
    
    if (!Array.isArray(bounds))
        throw new Error('The bounds must be an array');

    const boundsVectors = extractBounds(bounds);

    opts = Object.assign({
        maxIterations: Number.MAX_SAFE_INTEGER,
        maxRuntimeMs: undefined,
        epsilon: 0,
    }, opts);
    
    return binding.find_global(
        objective,
        boundsVectors.min,
        boundsVectors.max,
        opts.maxIterations,
        opts.epsilon,
        opts.maxRuntimeMs,
        ymult);
}

exports.findMaxGlobal = (fn, bounds, opts) => run(fn, bounds, opts, +1);

exports.findMinGlobal = (fn, bounds, opts) => run(fn, bounds, opts, -1);
