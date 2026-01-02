

import { Form } from "react-router";
import { PasswordInput } from "./PasswordInput";

interface LoginFormProps {
  actionData?: {
    errors?: {
      email?: string;
      password?: string;
      general?: string;
    }
  };
  isSubmitting: boolean;
}

export default function LoginForm({ actionData, isSubmitting }: LoginFormProps) {



  return (
    <Form method="post" className="p-0">
          <div className="py-8 px-10 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900 mb-1.5">Sign In</h2>
            <p className="text-sm text-gray-500 mb-7">Enter your credentials to continue</p>

            {actionData?.errors?.general && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-5">
                {actionData.errors.general}
              </div>
            )}

            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="user@company.com"
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg bg-white transition-all focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 placeholder:text-gray-400"
                aria-invalid={actionData?.errors?.email ? "true" : "false"}
              />
              {actionData?.errors?.email && (
                <span className="block text-sm text-red-500 mt-1.5">{actionData.errors.email}</span>
              )}
            </div>

            <div className="mb-5">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                placeholder="Enter your password"
                ariaInvalid={actionData?.errors?.password ? true : false}
              />
              {actionData?.errors?.password && (
                <span className="block text-sm text-red-500 mt-1.5">{actionData.errors.password}</span>
              )}
            </div>

            <div className="text-right mb-6">
              <a href="/forgot-password" className="text-blue-600 no-underline font-semibold transition-colors hover:text-blue-700 hover:underline">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3.5 text-base font-semibold text-white bg-blue-600 border-none rounded-lg cursor-pointer transition-all shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don&apos;t have an account?{" "}
              <a href="/register" className="text-blue-600 no-underline font-semibold transition-colors hover:text-blue-700 hover:underline">
                Register here
              </a>
            </p>
          </div>
        </Form>
  )
}
