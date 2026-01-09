"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { FaChartPie, FaChartLine, FaMobileAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Take Control of Your Finances with
            <span className="text-blue-600 dark:text-teal-400"> Quantro</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Track, manage, and optimize your spending with Quantro - the smart
            expense tracker designed for students.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push("/signup")}
              className="bg-blue-600 dark:bg-teal-500 hover:bg-blue-700 dark:hover:bg-teal-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg"
            >
              Get Started - It's Free
            </button>
            <button
              onClick={() => router.push("/login")}
              className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-8 border border-gray-300 rounded-lg shadow-sm transition-colors duration-200 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:hover:border-teal-500/50"
            >
              Sign In
            </button>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white dark:bg-slate-800/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Why Choose Quantro?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-6 bg-gray-50 rounded-xl dark:bg-slate-800 dark:border dark:border-slate-700 shadow-sm"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-teal-500/10 rounded-lg flex items-center justify-center mb-4">
                <FaChartPie className="text-blue-600 dark:text-teal-400 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Easy Tracking
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Quickly add and categorize your expenses with just a few taps.
                Keep track of where your money goes with our intuitive
                interface.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-6 bg-gray-50 rounded-xl dark:bg-slate-800 dark:border dark:border-slate-700 shadow-sm"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-teal-500/10 rounded-lg flex items-center justify-center mb-4">
                <FaChartLine className="text-blue-600 dark:text-teal-400 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Smart Analytics
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Visualize your spending patterns with beautiful charts and get
                insights to help you save more money.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="p-6 bg-gray-50 rounded-xl dark:bg-slate-800 dark:border dark:border-slate-700 shadow-sm"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-teal-500/10 rounded-lg flex items-center justify-center mb-4">
                <FaMobileAlt className="text-blue-600 dark:text-teal-400 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Mobile Friendly
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access Quantro from any device, anywhere. Perfect for students
                on the go!
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gray-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to take control of your finances?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already saving money and reducing
            financial stress with Quantro.
          </p>
          <button
            onClick={() => router.push("/signup")}
            className="bg-blue-600 dark:bg-teal-500 hover:bg-blue-700 dark:hover:bg-teal-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg"
          >
            Start Free Today
          </button>
        </div>
      </div>
    </main>
  );
}
