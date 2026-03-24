import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";

export default function Landing() {
  const { isAuthenticated } = useApp();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="rounded-3xl border border-sage/15 bg-white p-10 shadow-sm">
        <div className="text-center">
          <div className="text-sm font-semibold tracking-wide text-blush">ML-Based Prenatal Yoga Safety</div>
          <h1 className="mt-3 text-4xl font-bold text-sage">Prenatal Yoga AI</h1>
          <p className="mt-3 text-lg text-slate-600">Safe Yoga for Every Trimester</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            "Trimester-aware pose guidance",
            "Real-time webcam feedback",
            "Personalized video recommendations",
          ].map((t) => (
            <div key={t} className="rounded-2xl bg-cream p-5 text-sm text-slate-700">
              {t}
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link
                to="/register"
                className="rounded-xl bg-sage px-6 py-3 font-semibold text-white shadow"
              >
                Create account
              </Link>
              <Link
                to="/login"
                className="rounded-xl border border-sage px-6 py-3 font-semibold text-sage"
              >
                Log in
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/onboarding"
                className="rounded-xl bg-sage px-6 py-3 font-semibold text-white shadow"
              >
                Onboarding
              </Link>
              <Link
                to="/dashboard"
                className="rounded-xl border border-sage px-6 py-3 font-semibold text-sage"
              >
                Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
