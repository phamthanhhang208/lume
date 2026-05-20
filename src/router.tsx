import { createBrowserRouter, Navigate } from "react-router";

import SignIn from "@/routes/SignIn";
import AuthCallback from "@/routes/AuthCallback";
import Dashboard from "@/routes/Dashboard";
import AddProduct from "@/routes/AddProduct";
import ProductDetail from "@/routes/ProductDetail";
import Scan from "@/routes/Scan";
import Verdict from "@/routes/Verdict";
import Look from "@/routes/Look";
import Profile from "@/routes/Profile";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/sign-in", element: <SignIn /> },
  { path: "/auth/callback", element: <AuthCallback /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/products/new", element: <AddProduct /> },
  { path: "/products/:id", element: <ProductDetail /> },
  { path: "/scan", element: <Scan /> },
  { path: "/verdict", element: <Verdict /> },
  { path: "/look", element: <Look /> },
  { path: "/profile", element: <Profile /> },
]);
