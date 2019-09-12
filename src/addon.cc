/*
 * Copyright 2017 Ray Glover
 * Licensed under the Apache License, Version 2.0
 */

#include <napi.h>
#include <dlib/matrix.h>
#include <dlib/global_optimization.h>

Napi::Value find_global(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();

    if (info.Length() < 7) {
        Napi::Error::New(env, "Expected 7 arguments").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    auto objective_fn = info[0].As<Napi::Function>();
    auto x_lower      = info[1].As<Napi::Float64Array>();
    auto x_upper      = info[2].As<Napi::Float64Array>();
    auto max_iter     = dlib::max_function_calls(info[3].As<Napi::Number>().Int32Value());
    auto eps          = info[4].As<Napi::Number>().DoubleValue();
    auto duration     = !info[5].IsUndefined()
        ? std::chrono::milliseconds(info[5].As<Napi::Number>().Int32Value())
        : dlib::FOREVER;

    // Minimize or maximize the objective function?
    auto y_mult = info[6].As<Napi::Number>().Int32Value();

    const size_t N = x_lower.ElementLength();
    if (N != x_upper.ElementLength()) {
        Napi::Error::New(env, "Expected bounds arrays of length " + std::to_string(N)).ThrowAsJavaScriptException();
        return env.Undefined();
    }

    auto xJs = Napi::Float64Array::New(env, N);
    auto objective_wrapper = [&, N](const dlib::matrix<double, 0, 1>& x)
    {
        for (size_t n = 0; n < N; n++) xJs[n] = x(n);

        return objective_fn.Call(env.Global(), { xJs })
            .As<Napi::Number>()
            .DoubleValue();
    };

    dlib::matrix<double, 0, 1> lower_bounds = dlib::mat(x_lower.Data(), N);
    dlib::matrix<double, 0, 1> upper_bounds = dlib::mat(x_upper.Data(), N);

    dlib::function_evaluation result = y_mult == 1
        ? dlib::find_max_global(objective_wrapper, lower_bounds, upper_bounds, max_iter, duration, eps)
        : dlib::find_min_global(objective_wrapper, lower_bounds, upper_bounds, max_iter, duration, eps);

    // copy the result
    for (size_t n = 0; n < N; n++) xJs[n] = result.x(n);

    Napi::Object resultJs = Napi::Object::New(env);
    resultJs["y"] = result.y;
    resultJs["x"] = xJs;

    return resultJs;
}

Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    exports.Set(Napi::String::New(env, "find_global"), Napi::Function::New(env, find_global));
    return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)
