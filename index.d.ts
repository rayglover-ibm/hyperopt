/*
 * Copyright 2021 Ray Glover
 * Licensed under the Apache License, Version 2.0
 */

declare namespace hyperopt
{
    type Vec<T> = ArrayLike<T> & Iterable<T>;

    type ObjectiveFn = (xs: Vec<number>) => number;

    type Result = {
        /** The optimal point within a domain */
        x: Vec<number>;

        /** The value of f(x) */
        y: number
    }

    type OptimizerOptions = {
        /** Maximum number of times to call the objective */
        maxIterations: number;

        /**
         * Maximum elapsed time to run the optimizer,
         * in milliseconds.
         */
        maxRuntimeMs: number;

        /**
         * Constrains the search to only attempt to find a global
         * optimum to (at most) the given accuracy. A larger
         * value can result in finding a global optimum in fewer
         * iterations.
         *
         * @remarks See the dlib documentation of `solver_epsilon`
         * for a more detailed description of this option
         *
         * @defaultValue 0
         */
        epsilon: number;
    }

    /**
     * Defines the bounds of a variable in the objective
     * function domain. Optionally, the variable can be
     * treated as an integer by the optimizer by setting
     * param `isInteger` to true
     */
    type DomainVariable =
        { bounds: [number, number], isInteger?: boolean } | [number, number];

    interface GlobalOptimizer {
        /**
         * Iteratively search for the point which optimizes
         * the value of a given function subject to the
         * constrains defined by the given domain
         *
         * @remarks This function wraps the dlib function
         * `dlib::find_max_global`.
         *
         * @param fn The objective under consideration which
         * evaluates a point within the domain
         * @param domain The problem space to be searched
         * @param options The optimizer configuration
         *
         * @returns The point within the domain which optimizes
         * the objective
         */
        (
            fn: (xs: Vec<number>) => number,
            domain: ArrayLike<DomainVariable>,
            options?: Partial<OptimizerOptions>
        ): Result;
    }

    /** Minimizes a given objective function */
    const findMinGlobal: GlobalOptimizer;

    /** Maximizes a given objective function */
    const findMaxGlobal: GlobalOptimizer;
}

export = hyperopt;
