/*
 * Copyright 2017 Ray Glover
 * Licensed under the Apache License, Version 2.0
 */

const binding = require('bindings')('hyperopt');

function extractDomain(domain) {
    const N = domain.length;
    const min = new Float64Array(N);
    const max = new Float64Array(N);
    const isInteger = new Uint8Array(N);

    domain.forEach((spec, i) => {
        let bounds = !Array.isArray(spec) && typeof spec === 'object'
            ? spec.bounds
            : spec;

        if (spec.isInteger) {
            isInteger[i] = 1;
        }

        if (!Array.isArray(bounds) || bounds.length < 2)
            throw new Error('Invalid range at dimension ' + i);

        min[i] = bounds[0];
        max[i] = bounds[1];
    })

    return { min, max, isInteger };
}

function run(objective, domain, opts, ymult) {
    if (typeof objective !== 'function')
        throw new Error('The objective must be a function');

    if (!Array.isArray(domain))
        throw new Error('The domain must be an array');

    if (domain.length < 1)
        throw new Error('The domain must have a length > 0');

    const domainVecs = extractDomain(domain);

    opts = Object.assign({
        maxIterations: Number.MAX_SAFE_INTEGER,
        maxRuntimeMs: undefined,
        epsilon: 0,
    }, opts);

    return binding.find_global(
        objective,
        domainVecs.min,
        domainVecs.max,
        domainVecs.isInteger,
        opts.maxIterations,
        opts.epsilon,
        opts.maxRuntimeMs,
        ymult);
}

exports.findMaxGlobal = (fn, domain, opts) => run(fn, domain, opts, +1);

exports.findMinGlobal = (fn, domain, opts) => run(fn, domain, opts, -1);
