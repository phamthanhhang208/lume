import { createBrowserRouter, Navigate } from "react-router";

import RootLayout from "@/routes/RootLayout";
import SignIn from "@/routes/SignIn";
import AuthCallback from "@/routes/AuthCallback";
import Dashboard from "@/routes/Dashboard";
import AddProduct from "@/routes/AddProduct";
import ProductDetail from "@/routes/ProductDetail";
import Scan from "@/routes/Scan";
import Verdict from "@/routes/Verdict";
import Look from "@/routes/Look";
import Profile from "@/routes/Profile";
import { protectedLoader } from "@/features/auth/loaders/protectedLoader";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/sign-in", element: <SignIn /> },
      { path: "/auth/callback", element: <AuthCallback /> },
      {
        loader: protectedLoader,
        children: [
          { path: "/", element: <Navigate to="/dashboard" replace /> },
          { path: "/dashboard", element: <Dashboard /> },
          { path: "/products/new", element: <AddProduct /> },
          { path: "/products/:id", element: <ProductDetail /> },
          { path: "/scan", element: <Scan /> },
          { path: "/verdict", element: <Verdict /> },
          { path: "/look", element: <Look /> },
          { path: "/profile", element: <Profile /> },
        ],
      },
    ],
  },
]);
