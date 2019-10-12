/*
 * Copyright 2017 Ray Glover
 * Licensed under the Apache License, Version 2.0
 */

#include <cmath>
#include <napi.h>
#include <dlib/matrix.h>
#include <dlib/global_optimization.h>

Napi::Value JSThrow(Napi::Env& env, const std::string& err)
{
    Napi::Error::New(env, err).ThrowAsJavaScriptException();
    return env.Undefined();
}

Napi::Value find_global(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();

    if (info.Length() < 8) {
       return JSThrow(env, "Expected 8 arguments");
    }

    const auto objective_fn = info[0].As<Napi::Function>();
    const auto x_lower      = info[1].As<Napi::Float64Array>();
    const auto x_upper      = info[2].As<Napi::Float64Array>();
    const auto x_is_int     = info[3].As<Napi::Uint8Array>();
    const auto max_iter     = dlib::max_function_calls(info[4].As<Napi::Number>().Int32Value());
    const auto eps          = info[5].As<Napi::Number>().DoubleValue();
    const auto duration     = !info[6].IsUndefined()
        ? std::chrono::milliseconds(info[6].As<Napi::Number>().Int32Value())
        : dlib::FOREVER;

    // Minimize or maximize the objective function?
    auto y_mult = info[7].As<Napi::Number>().Int32Value();

    const size_t N = x_lower.ElementLength();
    if (N != x_upper.ElementLength() || N != x_is_int.ElementLength()) {
        return JSThrow(env, "Expected bounds arrays of length " + std::to_string(N));
    }

    // Wrap the objective function so it can be called by dlib
    auto x_js = Napi::Float64Array::New(env, N);

    auto objective_wrapper = [&, N](const dlib::matrix<double, 0, 1>& x) {
        for (size_t n = 0; n < N; n++) { x_js[n] = x(n); }

        const double value { objective_fn.Call(env.Global(), { x_js }).As<Napi::Number>() };
        if (std::isnan(value)) {
            // dlib::find_max_global will segfault on encountering nan's.
            throw dlib::error("Objective function returned a NaN.");
        }
        return value;
    };

    // Define the bounds
    const dlib::matrix<double, 0, 1> lower_bounds = dlib::mat(x_lower.Data(), N);
    const dlib::matrix<double, 0, 1> upper_bounds = dlib::mat(x_upper.Data(), N);

    // Flag integer variables in the domain
    std::vector<bool> is_int(N, false);
    for (size_t n = 0; n < N; n++) { is_int[n] = x_is_int[n] == 1; }

    // Optimize
    dlib::function_evaluation result;

    try {
        result = y_mult == 1
            ? dlib::find_max_global(objective_wrapper, lower_bounds, upper_bounds, is_int, max_iter, duration, eps)
            : dlib::find_min_global(objective_wrapper, lower_bounds, upper_bounds, is_int, max_iter, duration, eps);
    } catch (dlib::error& e) {
        return JSThrow(env, "(Solver error) " + std::string(e.what()));
    }

    // Copy the result x vector
    for (size_t n = 0; n < N; n++) { x_js[n] = result.x(n); }

    // Output as { x: number[], y: number }
    Napi::Object resultJs = Napi::Object::New(env);
    resultJs["y"] = result.y;
    resultJs["x"] = x_js;

    return resultJs;
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    exports.Set(Napi::String::New(env, "find_global"), Napi::Function::New(env, find_global));
    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
